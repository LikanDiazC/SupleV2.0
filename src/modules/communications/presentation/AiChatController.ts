import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../iam/infrastructure/guards/JwtAuthGuard';
import { AiSummarizerService } from '../infrastructure/ai/AiSummarizerService';

@Controller('ai') // Escuchará en http://localhost:3000/ai/...
export class AiChatController {
  constructor(private readonly aiService: AiSummarizerService) {}

  @UseGuards(JwtAuthGuard)
  @Post('chat') // Escuchará en /ai/chat
  async chat(@Body() body: { message: string, history?: any[] }) {
    
    // Le pasamos el mensaje del frontend a nuestro servicio de Gemini
    const aiResponse = await this.aiService.askAssistant(body.message);
    
    // Devolvemos el JSON exacto que el Frontend de Claude está esperando
    return { response: aiResponse };
  }
}