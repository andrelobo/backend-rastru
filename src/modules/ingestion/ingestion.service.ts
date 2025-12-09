// src/modules/ingestion/ingestion.service.ts
import { Injectable } from '@nestjs/common';
import { InfosimplesService } from '../infosimples/infosimples.service';

@Injectable()
export class IngestionService {
  constructor(private readonly infosimplesService: InfosimplesService) {
    console.log('IngestionService inicializado com InfosimplesService');
  }

  async ingestNfceKey(nfceKey: string) {
    console.log(`Processando NFC-e: ${nfceKey}`);
    
    if (!nfceKey || nfceKey.length < 44) {
      throw new Error('Chave NFC-e inválida');
    }
    
    return await this.infosimplesService.consultNfce(nfceKey);
  }
}