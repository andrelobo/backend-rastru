// src/modules/ingestion/ingestion.module.ts
import { Module } from '@nestjs/common';
import { IngestionService } from './ingestion.service';
import { IngestionController } from './ingestion.controller';
import { InfosimplesModule } from '../infosimples/infosimples.module'; // Importe o módulo

@Module({
  imports: [InfosimplesModule], // Adicione esta linha
  controllers: [IngestionController],
  providers: [IngestionService],
  exports: [IngestionService]
})
export class IngestionModule {}