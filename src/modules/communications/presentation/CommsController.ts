import { Controller, Get, Res, Req, Query, UseGuards, Inject, Post, Body } from '@nestjs/common';
import type { Response, Request } from 'express';
import { GoogleMailService } from '../infrastructure/google/GoogleMailService';
import { IngestEmailContactUseCase } from '../../crm/application/use-cases/IngestEmailContactUseCase';
import type { IEmailRepository } from '../domain/repositories/IEmailRepository'; // 👈 Importa el contrato
import { EmailMessage } from '../domain/entities/EmailMessage';
import { TenantId } from '../../iam/domain/value-objects/TenantId';
import { UniqueId } from '../../../shared/kernel/UniqueId';
import { JwtAuthGuard } from 'src/modules/iam/infrastructure/guards/JwtAuthGuard';

@Controller('comms') 
export class CommsController {
  constructor(
    private readonly googleMailService: GoogleMailService,
    private readonly ingestEmailContactUseCase: IngestEmailContactUseCase,
    @Inject('IEmailRepository') private readonly emailRepo: IEmailRepository,    
  ) {}

  // 👇 NUEVA RUTA PROTEGIDA: El frontend pide el enlace de Google
  @UseGuards(JwtAuthGuard)
  @Get('auth/google-url')
  getGoogleAuthUrl(@Req() request: Request) {
    const userPayload = request['user'] as any;
    const userId = userPayload.sub || userPayload.id;
    
    // Generamos el enlace con el ID de este usuario en específico
    const url = this.googleMailService.getAuthUrl(userId, userPayload.tenantId);
    
    return { 
      message: 'Abre esta URL en tu navegador para vincular tu Gmail',
      url: url 
    };
  }

  // 👇 RUTA DE RETORNO: Google nos devuelve el código y nuestro "equipaje" (state)
  @Get('auth/callback')
  async googleAuthCallback(
    @Query('code') code: string, 
    @Query('state') state: string, 
    @Res() res: Response
  ) {
    if (!code) return res.status(400).send('Falta el código.');

    try {
      const decodedState = Buffer.from(state, 'base64').toString('utf-8');
      const { userId, tenantId } = JSON.parse(decodedState);

      const client = this.googleMailService.getClient();
      const { tokens } = await client.getToken(code);

      const userEmailAddress = await this.googleMailService.getUserEmail(tokens);
      this.googleMailService.activeUsers.set(userEmailAddress, { 
        userId, 
        tenantId, 
        tokens 
      });
      
      const recentEmails = await this.googleMailService.getRecentEmails(tokens);
      
      await this.googleMailService.watchInbox(tokens);

      let procesados = 0;
      for (const emailData of recentEmails) {
        // 1. Verificamos si este correo ya existe en la BD (por su ID de Google)
        const existingEmail = await this.emailRepo.findByExternalId(emailData.id);
        if (existingEmail) continue; // Si ya existe, lo saltamos

        if (emailData.from) {
          // 2. Pasamos el remitente por el "Escáner" del CRM
          const crmResult = await this.ingestEmailContactUseCase.execute(tenantId, emailData.from);

          // 3. Construimos nuestra entidad de Correo
          const newEmail = EmailMessage.create({
            tenantId: new TenantId(tenantId),
            userId: new UniqueId(userId),
            externalMessageId: emailData.id,
            threadId: emailData.id, // Por ahora usamos el id como thread
            sender: emailData.from,
            recipient: 'me', // Para ti
            subject: emailData.subject || '(Sin Asunto)',
            bodySnippet: emailData.snippet || '',
            bodyHtml: '', 
            receivedAt: new Date(),
            isProcessed: true,
          });

          // 4. Si el Escáner encontró/creó un contacto, lo vinculamos! 🔗
          if (crmResult?.contact) {
            newEmail.linkToContact(crmResult.contact.id);
          }

          // 5. Guardamos en la base de datos
          await this.emailRepo.save(newEmail);
          procesados++;
        }
      }

      return res.json({
        message: '¡Bandeja sincronizada con éxito!',
        ownerId: userId,
        correosNuevosGuardados: procesados,
      });

    } catch (error) {
      console.error('Error al sincronizar:', error);
      return res.status(500).send('Hubo un error en la sincronización.');
    }
  }
  
@Post('webhook/gmail')
  async handleGmailWebhook(@Body() body: any, @Res() res: Response) {
    // 1. Respondemos rapidísimo a Google
    res.status(200).send('OK'); 

    if (!body.message || !body.message.data) return; 

    try {
      const decodedData = Buffer.from(body.message.data, 'base64').toString('utf-8');
      const notification = JSON.parse(decodedData);
      const emailAddress = notification.emailAddress;

      console.log(`🔔 [WEBHOOK] ¡Aviso de Google para la cuenta: ${emailAddress}!`);

      // 2. Buscamos las llaves en nuestra Caja Fuerte
      const session = this.googleMailService.activeUsers.get(emailAddress);
      
      if (!session) {
        console.log(`❌ [WEBHOOK] No hay llaves guardadas en memoria para ${emailAddress}`);
        return;
      }

      console.log(`⏳ [WEBHOOK] Descargando nuevos correos...`);

      // 3. ¡Usamos las llaves para descargar los últimos correos!
      const recentEmails = await this.googleMailService.getRecentEmails(session.tokens);
      let guardados = 0;

      // 4. Los pasamos por el escaner del CRM y la Base de Datos
      for (const emailData of recentEmails) {
        // Evitamos duplicados
        const existingEmail = await this.emailRepo.findByExternalId(emailData.id);
        if (existingEmail) continue; 

        if (emailData.from) {
          const crmResult = await this.ingestEmailContactUseCase.execute(session.tenantId, emailData.from);

          const newEmail = EmailMessage.create({
            tenantId: new TenantId(session.tenantId),
            userId: new UniqueId(session.userId),
            externalMessageId: emailData.id,
            threadId: emailData.id,
            sender: emailData.from,
            recipient: 'me',
            subject: emailData.subject || '(Sin Asunto)',
            bodySnippet: emailData.snippet || '',
            bodyHtml: '', 
            receivedAt: new Date(),
            isProcessed: true,
          });

          if (crmResult?.contact) {
            newEmail.linkToContact(crmResult.contact.id);
          }

          await this.emailRepo.save(newEmail);
          guardados++;
        }
      }

      if (guardados > 0) {
        console.log(`✅ [WEBHOOK] ¡ÉXITO! Se procesaron y guardaron ${guardados} correos nuevos en la base de datos.`);
      } else {
        console.log(`ℹ️ [WEBHOOK] Los correos detectados ya estaban en la base de datos o no eran relevantes.`);
      }

    } catch (error) {
      console.error('❌ [WEBHOOK] Error procesando el aviso:', error);
    }
  }
}
