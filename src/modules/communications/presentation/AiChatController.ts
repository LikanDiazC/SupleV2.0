import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../iam/infrastructure/guards/JwtAuthGuard';
import { AiSummarizerService } from '../infrastructure/ai/AiSummarizerService';

@Controller('ai') // Escuchará en http://localhost:3000/ai/...
export class AiChatController {
  constructor(private readonly aiService: AiSummarizerService) {}

  @UseGuards(JwtAuthGuard)
  @Post('chat') // Escuchará en /ai/chat
  async chat(@Req() request: Request, @Body() body: { message: string, history?: any[] }) {
    const userPayload = request['user'] as any;
    console.log("=== AI CHAT REQUEST ===");
    console.log("User Payload:", userPayload);
    console.log("Message:", body.message);
    
    // Le pasamos el mensaje del frontend y el tenantId a nuestro servicio de Gemini
    const aiResponse = await this.aiService.askAssistant(body.message, userPayload.tenantId);
    
    // Devolvemos el JSON exacto que el Frontend de Claude está esperando
    return { response: aiResponse };
  }
}