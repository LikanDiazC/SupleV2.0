import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import type { OAuth2Client } from 'google-auth-library';

@Injectable()
export class GoogleMailService {
  private oauth2Client: OAuth2Client;
  public activeUsers = new Map<string, { userId: string, tenantId: string, tokens: any }>();

  constructor() {
    // Inicializamos el cliente con las variables de tu archivo .env
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_CALLBACK_URL, // Ej: http://localhost:3000/comms/auth/callback
    );
  }

  // Genera la URL mágica para iniciar sesión
getAuthUrl(userId: string, tenantId: string): string {
    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
    ];

    // 1. Empaquetamos quién es este usuario en un texto (Base64)
    const stateObj = JSON.stringify({ userId, tenantId });
    const encodedState = Buffer.from(stateObj).toString('base64');

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: scopes,
      state: encodedState, // 👈 Se lo mandamos a Google como "equipaje"
    });
  }

  // Exponemos el cliente por si lo necesitamos después para otras peticiones
  getClient(): OAuth2Client {
    return this.oauth2Client;
  }
  ///////////////
  // ... (debajo de getClient)

  async getRecentEmails(tokens: any): Promise<any[]> {
    // 1. Le ponemos los tokens a nuestro cliente
    this.oauth2Client.setCredentials(tokens);
    
    // 2. Instanciamos la API de Gmail
    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

    // 3. Pedimos la lista de los últimos 3 correos
    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 3,
    });

    const messages = response.data.messages || [];
    const emailsData: any[] = [];

    // 4. Por cada correo, descargamos el detalle (Asunto, De, Para)
    for (const msg of messages) {
      if (!msg.id) continue;
      
      const msgDetail = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id,
      });

      // Extraemos las cabeceras importantes
      const headers = msgDetail.data.payload?.headers;
      const subject = headers?.find(h => h.name === 'Subject')?.value;
      const from = headers?.find(h => h.name === 'From')?.value;

      emailsData.push({
        id: msg.id,
        from: from,
        subject: subject,
        snippet: msgDetail.data.snippet, // Un pequeño resumen del correo
      });
    }

    return emailsData;
  }

async watchInbox(tokens: any): Promise<void> {
    this.oauth2Client.setCredentials(tokens);
    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

    try {
      const res = await gmail.users.watch({
        userId: 'me',
        requestBody: {
          labelIds: ['INBOX'],
          // 👇 ¡Tu Topic REAL!
          topicName: 'projects/suple-492619/topics/gmail-webhook-topic', 
        },
      });
      // 👇 Agrega este console.log para confirmar que se activó
      console.log('👀 Gmail Watch activado:', res.data); 
    } catch (error) {
      console.error('Error al activar Gmail Watch:', error);
    }
  }

  async getUserEmail(tokens: any): Promise<string> {
    this.oauth2Client.setCredentials(tokens);
    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
    const profile = await gmail.users.getProfile({ userId: 'me' });
    return profile.data.emailAddress || '';
  }
}
