import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class AiSummarizerService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  }

  async summarizeEmail(subject: string, body: string): Promise<string> {
    try {
      console.log('🤖 IA: Iniciando resumen para:', subject); // LOG 1

      if (!process.env.GEMINI_API_KEY) {
        console.error('❌ IA: No hay API KEY en el .env');
        return 'Error: Sin API Key';
      }
      
      const model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      
      const prompt = `Resume en 2 líneas este correo para un vendedor:
      Asunto: ${subject}
      Mensaje: ${body}`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      console.log('✅ IA: Respuesta recibida:', responseText); // LOG 2
      
      return responseText.trim() || 'La IA devolvió un texto vacío.';

    } catch (error: any) {
      console.error('❌ IA: Error detallado:', error.message); // LOG 3
      return 'No se pudo generar el resumen automático.';
    }
  }
}

