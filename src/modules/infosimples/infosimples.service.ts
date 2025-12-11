import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';

@Injectable()
export class InfosimplesService {
  private readonly logger = new Logger(InfosimplesService.name);
  private readonly apiToken: string;

  constructor(private readonly httpService: HttpService) {
    this.apiToken = process.env.INFOSIMPLES_API_TOKEN || '';
    
    if (!this.apiToken || this.apiToken.includes('seu_token')) {
      this.logger.error('❌ ERRO: INFOSIMPLES_API_TOKEN não configurado no .env!');
    } else {
      this.logger.log(`✅ Token Infosimples configurado: ${this.apiToken.substring(0, 10)}...`);
    }
  }

  /**
   * Consulta NFC-e ou NF-e automaticamente detectando o tipo
   */
  async consultNfe(chaveAcesso: string, timeout: number = 30): Promise<any> {
    try {
      // Detecta se é NFC-e (65) ou NF-e (55)
      const modelo = chaveAcesso.substring(20, 22);
      const isNFCe = modelo === '65';
      
      // ✅✅✅ ENDPOINTS CORRETOS (CONFIRMADOS NA DOCUMENTAÇÃO INFOSIMPLES):
      const endpoint = isNFCe 
        ? 'https://api.infosimples.com/api/v2/consultas/nfe/nfce'  // Para NFC-e
        : 'https://api.infosimples.com/api/v2/consultas/nfe/nfe';   // Para NF-e
      
      // ✅✅✅ PARÂMETROS CORRETOS:
      const params = isNFCe
        ? { chave: chaveAcesso }      // NFC-e usa "chave"
        : { nfe: chaveAcesso };       // NF-e usa "nfe"

      this.logger.log(`🔗 Endpoint: ${endpoint}`);
      this.logger.log(`🔍 Consultando ${isNFCe ? 'NFC-e' : 'NF-e'}: ${chaveAcesso.substring(0, 8)}...`);

      const requestData = new URLSearchParams({
        token: this.apiToken,
        timeout: timeout.toString(),
        ...params,
        ignore_site_receipt: '1',
      }).toString();

      this.logger.debug(`📤 Dados da requisição: ${requestData.replace(this.apiToken, 'TOKEN_HIDDEN')}`);

      const response: AxiosResponse = await firstValueFrom(
        this.httpService.post(
          endpoint,
          requestData,
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            timeout: (timeout + 5) * 1000,
          }
        )
      );

      this.logger.log(`✅ API respondeu com código: ${response.data?.code}`);
      return response.data;
      
    } catch (error: any) {
      this.logger.error(`❌ Erro na consulta: ${error.message}`);
      
      if (error.response?.data) {
        const errorData = error.response.data;
        this.logger.error(`📊 Código: ${errorData.code}`);
        this.logger.error(`📊 Mensagem: ${errorData.code_message}`);
        this.logger.error(`📊 Serviço tentado: ${errorData.header?.service || 'N/A'}`);
        
        // Log completo para debug
        this.logger.error(`📋 Resposta completa do erro: ${JSON.stringify(errorData)}`);
      }
      
      throw error;
    }
  }

  /**
   * Teste de conexão simples
   */
  async testConnection(): Promise<any> {
    return {
      connected: !!this.apiToken,
      token_length: this.apiToken.length,
      message: this.apiToken ? 'Token configurado' : 'Token não configurado',
    };
  }

  /**
   * Teste específico para uma chave
   */
  async testChaveEspecifica(chaveAcesso: string): Promise<any> {
    try {
      const resultado = await this.consultNfe(chaveAcesso, 10);
      return {
        success: true,
        chave: chaveAcesso,
        code: resultado.code,
        data_count: resultado.data_count,
        has_data: !!(resultado.data && resultado.data.length > 0),
      };
    } catch (error: any) {
      return {
        success: false,
        chave: chaveAcesso,
        error: error.response?.data || error.message,
      };
    }
  }
}