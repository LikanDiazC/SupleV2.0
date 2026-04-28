import { Controller, Get, Res, Req, Query, UseGuards, Inject, Post, Body, HttpCode } from '@nestjs/common';
import type { Response, Request } from 'express';
import { GoogleMailService } from '../infrastructure/google/GoogleMailService';
import { IngestEmailContactUseCase } from '../../crm/application/use-cases/IngestEmailContactUseCase';
import { GetActiveDealForContactUseCase } from '../../crm/application/use-cases/GetActiveDealForContactUseCase';
import { AddDealActivityUseCase } from '../../crm/application/use-cases/AddDealActivityUseCase';
import { SyncGoogleContactsUseCase } from '../../crm/application/use-cases/SyncGoogleContactsUseCase';
import type { IUserRepository } from '../../iam/domain/repositories/IUserRepository';
import type { IEmailRepository } from '../domain/repositories/IEmailRepository'; 
import { EmailMessage } from '../domain/entities/EmailMessage';
import { TenantId } from '../../iam/domain/value-objects/TenantId';
import { UniqueId } from '../../../shared/kernel/UniqueId';
import { JwtAuthGuard } from 'src/modules/iam/infrastructure/guards/JwtAuthGuard';
import { WebhookSecretGuard } from 'src/common/guards/WebhookSecretGuard';
import { AiSummarizerService } from '../infrastructure/ai/AiSummarizerService';

@Controller('comms') 
export class CommsController {
  constructor(
    private readonly googleMailService: GoogleMailService,
    private readonly ingestEmailContactUseCase: IngestEmailContactUseCase,
    private readonly getActiveDealForContactUseCase: GetActiveDealForContactUseCase,
    private readonly addDealActivityUseCase: AddDealActivityUseCase,
    private readonly syncGoogleContactsUseCase: SyncGoogleContactsUseCase,
    @Inject('IEmailRepository') private readonly emailRepo: IEmailRepository,
    @Inject('IUserRepository') private readonly userRepo: IUserRepository,
    private readonly aiSummarizer: AiSummarizerService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('auth/google-url')
  getGoogleAuthUrl(@Req() request: Request) {
    const userPayload = request['user'] as any;
    const userId = userPayload.sub || userPayload.id;
    const url = this.googleMailService.getAuthUrl(userId, userPayload.tenantId);
    return { url };
  }

  @UseGuards(JwtAuthGuard)
  @Get('auth/status')
  getGoogleAuthStatus(@Req() request: Request) {
    const userPayload = request['user'] as any;
    const email = userPayload.email as string;
    const linked = !!email && this.googleMailService.activeUsers.has(email);
    return { linked };
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

      // Persistir tokens en BD vinculados al usuario
      await this.userRepo.saveGoogleTokens(userId, tokens);
      
      const recentEmails = await this.googleMailService.getRecentEmails(tokens);
      await this.googleMailService.watchInbox(tokens);

      await this.processEmails(recentEmails, tenantId, userId);

      // Sync de contactos en background — no bloquea el redirect
      this.googleMailService.getGoogleContacts(tokens)
        .then((contacts) => this.syncGoogleContactsUseCase.execute(tenantId, contacts))
        .then((result) => console.log(`✅ Contactos Google sincronizados: ${result.created} nuevos, ${result.skipped} ya existían`))
        .catch((err) => console.warn('⚠️ No se pudieron sincronizar contactos de Google:', err.message));

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      return res.redirect(`${frontendUrl}/overview`);
    } catch (error) {
      console.error('Error al sincronizar:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      return res.redirect(`${frontendUrl}/overview?google_error=1`);
    }
  }
  
  @UseGuards(WebhookSecretGuard)
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

  @UseGuards(JwtAuthGuard)
  @Get('emails')
  async getEmails(@Req() request: Request) {
    const userPayload = request['user'] as any;
    const emails = await this.emailRepo.findAll(userPayload.tenantId);
    return emails.map(e => ({
      id:          e.id.value,
      sender:      e.sender,
      subject:     e.subject,
      bodySnippet: e.bodySnippet,
      bodyHtml:    e.bodyHtml,
      receivedAt:  e.receivedAt,
      isProcessed: e.isProcessed,
    }));
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  @Post('auth/restore-session')
  async restoreGoogleSession(@Req() request: Request) {
    const userPayload = request['user'] as any;
    const userId   = userPayload.sub as string;
    const tenantId = userPayload.tenantId as string;
    const email    = userPayload.email as string;

    // Ya está en memoria
    if (this.googleMailService.activeUsers.has(email)) {
      return { restored: true };
    }

    const tokens = await this.userRepo.getGoogleTokens(userId);
    if (!tokens?.refresh_token) return { restored: false };

    this.googleMailService.activeUsers.set(email, { userId, tenantId, tokens });

    // Sincronizar contactos en background
    this.googleMailService.getGoogleContacts(tokens)
      .then((contacts) => this.syncGoogleContactsUseCase.execute(tenantId, contacts))
      .then((r) => console.log(`✅ Contactos restaurados: ${r.created} nuevos`))
      .catch((err) => console.warn('⚠️ Error restaurando contactos:', err.message));

    return { restored: true };
  }

  @UseGuards(JwtAuthGuard)
  @Post('sync-contacts')
  async syncContacts(@Req() request: Request) {
    const userPayload = request['user'] as any;
    const tenantId    = userPayload.tenantId;
    const userEmail   = userPayload.email;

    const session = this.googleMailService.activeUsers.get(userEmail);
    if (!session) {
      return { message: 'No hay sesión de Google activa. Vincula tu cuenta primero.', synced: 0 };
    }

    const contacts = await this.googleMailService.getGoogleContacts(session.tokens);
    const result   = await this.syncGoogleContactsUseCase.execute(tenantId, contacts);
    return { message: 'Sincronización completada', ...result };
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
          bodyHtml: emailData.bodyHtml || '',
          receivedAt: emailData.date ? new Date(emailData.date) : new Date(),
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

        }
        }

        await this.emailRepo.save(newEmail);
        guardados++;
      }
    }
    
    if (guardados > 0) console.log(`✅ ¡ÉXITO! Se guardaron y enrutaron ${guardados} correos.`);
  }
}