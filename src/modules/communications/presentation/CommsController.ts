import { Controller, Get, Res, Req, Query, UseGuards, Inject, Post, Body } from '@nestjs/common';
import type { Response, Request } from 'express';
import { GoogleMailService } from '../infrastructure/google/GoogleMailService';
import { IngestEmailContactUseCase } from '../../crm/application/use-cases/IngestEmailContactUseCase';
import { GetActiveDealForContactUseCase } from '../../crm/application/use-cases/GetActiveDealForContactUseCase'; // 👈 NUEVO
import { AddDealActivityUseCase } from '../../crm/application/use-cases/AddDealActivityUseCase'; // 👈 NUEVO
import type { IEmailRepository } from '../domain/repositories/IEmailRepository'; 
import { EmailMessage } from '../domain/entities/EmailMessage';
import { TenantId } from '../../iam/domain/value-objects/TenantId';
import { UniqueId } from '../../../shared/kernel/UniqueId';
import { JwtAuthGuard } from 'src/modules/iam/infrastructure/guards/JwtAuthGuard';
import { AiSummarizerService } from '../infrastructure/ai/AiSummarizerService';

@Controller('comms') 
export class CommsController {
  constructor(
    private readonly googleMailService: GoogleMailService,
    private readonly ingestEmailContactUseCase: IngestEmailContactUseCase,
    private readonly getActiveDealForContactUseCase: GetActiveDealForContactUseCase, // 👈 INYECTADO
    private readonly addDealActivityUseCase: AddDealActivityUseCase,                 // 👈 INYECTADO
    @Inject('IEmailRepository') private readonly emailRepo: IEmailRepository, 
    private readonly aiSummarizer: AiSummarizerService,   
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('auth/google-url')
  getGoogleAuthUrl(@Req() request: Request) {
    const userPayload = request['user'] as any;
    const userId = userPayload.sub || userPayload.id;
    const url = this.googleMailService.getAuthUrl(userId, userPayload.tenantId);
    return { message: 'Abre esta URL en tu navegador para vincular tu Gmail', url: url };
  }

@Get('auth/callback')
  async googleAuthCallback(@Query('code') code: string, @Query('state') state: string, @Res() res: Response) {
    if (!code || !state) return res.status(400).send('Faltan parámetros (code o state).');

    let userId: string;
    let tenantId: string;

    // 🛡️ BLINDAJE: Intentamos leer el estado. Si viene basura, lo atajamos sin que explote.
    try {
      const decodedState = Buffer.from(state, 'base64').toString('utf-8');
      const parsedState = JSON.parse(decodedState);
      userId = parsedState.userId;
      tenantId = parsedState.tenantId;
    } catch (error) {
      return res.status(400).send('El enlace de autorización es inválido o está corrupto.');
    }

    try {
      const client = this.googleMailService.getClient();
      const { tokens } = await client.getToken(code);

      const userEmailAddress = await this.googleMailService.getUserEmail(tokens);
      this.googleMailService.activeUsers.set(userEmailAddress, { userId, tenantId, tokens });
      
      const recentEmails = await this.googleMailService.getRecentEmails(tokens);
      await this.googleMailService.watchInbox(tokens);

      await this.processEmails(recentEmails, tenantId, userId);

      return res.json({ message: '¡Bandeja sincronizada con éxito!', ownerId: userId });
    } catch (error) {
      console.error('Error al sincronizar:', error);
      return res.status(500).send('Hubo un error en la sincronización con Google.');
    }
  }
  
  @Post('webhook/gmail')
  async handleGmailWebhook(@Body() body: any, @Res() res: Response) {
    res.status(200).send('OK'); 

    if (!body.message || !body.message.data) return; 

    try {
      const decodedData = Buffer.from(body.message.data, 'base64').toString('utf-8');
      const notification = JSON.parse(decodedData);
      const emailAddress = notification.emailAddress;

      const session = this.googleMailService.activeUsers.get(emailAddress);
      if (!session) return;

      const recentEmails = await this.googleMailService.getRecentEmails(session.tokens);
      await this.processEmails(recentEmails, session.tenantId, session.userId); // 👈 Reutilizamos la lógica

    } catch (error) {
      console.error('❌ [WEBHOOK] Error procesando el aviso:', error);
    }
  }

  // 👇 LÓGICA CENTRALIZADA PARA PROCESAR CORREOS
  private async processEmails(emails: any[], tenantId: string, userId: string) {
    let guardados = 0;
    
    for (const emailData of emails) {
      const existingEmail = await this.emailRepo.findByExternalId(emailData.id);
      if (existingEmail) continue; 

      if (emailData.from) {
        const crmResult = await this.ingestEmailContactUseCase.execute(tenantId, emailData.from);

        const newEmail = EmailMessage.create({
          tenantId: new TenantId(tenantId),
          userId: new UniqueId(userId),
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

          // 🧠 ¡MAGIA DE ENRUTAMIENTO! Buscamos si tiene un Deal Activo
          const activeDeal = await this.getActiveDealForContactUseCase.execute(tenantId, crmResult.contact.id.value);
          
if (activeDeal) {
          newEmail.linkToDeal(new UniqueId(activeDeal.id));

          // Guardamos en la bitácora del Negocio que entró un correo
          await this.addDealActivityUseCase.execute(
            tenantId, 
            userId, 
            activeDeal.id, 
            {
              type: 'EMAIL_VINCULADO',
              content: `✉️ Correo recibido: "${emailData.subject}"\nResumen: ${emailData.snippet}`
            }
          );

          // 🧠 ¡AQUÍ ENTRA LA INTELIGENCIA ARTIFICIAL! 🧠
          // Le pedimos a la IA que lea el correo y nos dé un resumen
          const iaSummary = await this.aiSummarizer.summarizeEmail(
            emailData.subject || '', 
            emailData.snippet || ''
          );

          // Guardamos el resumen de la IA en el tablero del negocio
          await this.addDealActivityUseCase.execute(
            tenantId, 
            userId, 
            activeDeal.id, 
            {
              type: 'AI_SUMMARY',
              content: `🤖 Asistente IA:\n${iaSummary}`
            }
          );
        }
        }

        await this.emailRepo.save(newEmail);
        guardados++;
      }
    }
    
    if (guardados > 0) console.log(`✅ ¡ÉXITO! Se guardaron y enrutaron ${guardados} correos.`);
  }
}