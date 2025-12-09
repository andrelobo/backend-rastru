import { Injectable } from '@nestjs/common';

@Injectable()
export class IngestionService {
  async processarNFCe(chaveAcesso: string, timeout?: number) {
    return {
      message: 'NFC-e mock processada',
      chaveAcesso,
      timestamp: new Date().toISOString()
    };
  }

  async processarAutomaticamente(qrCode: string, timeout?: number) {
    return {
      message: 'Documento mock processado',
      qrCode,
      timestamp: new Date().toISOString()
    };
  }

  async verificarConexaoMongoDB(): Promise<boolean> {
    return true;
  }

  async verificarConexaoInfosimples(): Promise<boolean> {
    return true;
  }

  async verificarStorage(): Promise<boolean> {
    return true;
  }
}
