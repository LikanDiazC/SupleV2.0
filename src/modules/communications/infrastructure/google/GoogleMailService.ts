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
      'https://www.googleapis.com/auth/contacts.readonly',
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
    this.oauth2Client.setCredentials(tokens);
    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 20,
    });

    const messages = response.data.messages || [];
    const emailsData: any[] = [];

    for (const msg of messages) {
      if (!msg.id) continue;

      const msgDetail = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id,
        format: 'full',
      });

      const headers = msgDetail.data.payload?.headers ?? [];
      const subject = headers.find(h => h.name === 'Subject')?.value ?? '(Sin Asunto)';
      const from    = headers.find(h => h.name === 'From')?.value ?? '';
      const date    = headers.find(h => h.name === 'Date')?.value;

      const bodyHtml = this.extractBody(msgDetail.data.payload, 'text/html');
      const bodyText = this.extractBody(msgDetail.data.payload, 'text/plain');

      emailsData.push({
        id:      msg.id,
        from,
        subject,
        snippet: msgDetail.data.snippet ?? '',
        bodyHtml,
        bodyText,
        date,
      });
    }

    return emailsData;
  }

  private extractBody(payload: any, mimeType: string): string {
    if (!payload) return '';
    if (payload.mimeType === mimeType && payload.body?.data) {
      return Buffer.from(payload.body.data, 'base64url').toString('utf-8');
    }
    if (payload.parts) {
      for (const part of payload.parts) {
        const result = this.extractBody(part, mimeType);
        if (result) return result;
      }
    }
    return '';
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

  async getGoogleContacts(tokens: any): Promise<GoogleContactRaw[]> {
    this.oauth2Client.setCredentials(tokens);
    const people = google.people({ version: 'v1', auth: this.oauth2Client });

    const results: GoogleContactRaw[] = [];
    let pageToken: string | undefined;

    do {
      const res = await people.people.connections.list({
        resourceName: 'people/me',
        personFields: 'names,emailAddresses,organizations',
        pageSize: 1000,
        ...(pageToken ? { pageToken } : {}),
      });

      for (const person of res.data.connections ?? []) {
        const email = person.emailAddresses?.[0]?.value;
        if (!email) continue;
        results.push({
          email: email.toLowerCase(),
          name:  person.names?.[0]?.displayName ?? '',
          org:   person.organizations?.[0]?.name ?? '',
          domain: person.organizations?.[0]?.domain ?? '',
        });
      }

      pageToken = res.data.nextPageToken ?? undefined;
    } while (pageToken);

    return results;
  }
}

export interface GoogleContactRaw {
  email:  string;
  name:   string;
  org:    string;
  domain: string;
}
