import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'; // 👈 Nuevo
import { CommsController } from './presentation/CommsController';
import { GoogleMailService } from './infrastructure/google/GoogleMailService';
import { CrmModule } from '../crm/crm.module';
import { EmailMessageOrmEntity } from './infrastructure/persistence/orm-entities/EmailMessageOrmEntity'; // 👈 Nuevo
import { TypeOrmEmailRepository } from './infrastructure/persistence/TypeOrmEmailRepository'; // 👈 Nuevo
import { AiSummarizerService } from './infrastructure/ai/AiSummarizerService';
import { AiChatController } from './presentation/AiChatController';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmailMessageOrmEntity]), // 👈 Para que cree la tabla
    CrmModule
  ],
  controllers: [CommsController,AiChatController],
  providers: [
    GoogleMailService,
    AiSummarizerService,
    // Registramos el repositorio para poder inyectarlo
    { provide: 'IEmailRepository', useClass: TypeOrmEmailRepository } 
  ],
  exports: [GoogleMailService],
})
export class CommunicationsModule {}