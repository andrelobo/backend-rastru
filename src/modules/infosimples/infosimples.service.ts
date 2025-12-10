import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';

@Injectable()
export class InfosimplesService {
  private readonly logger = new Logger(InfosimplesService.name);
  private readonly apiToken: string;
  private readonly apiBase: string = 'https://api.infosimples.com/api/v2/consultas/sefaz/nfe';

  constructor(private readonly httpService: HttpService) {
    this.apiToken = process.env.INFOSIMPLES_API_TOKEN || '';
    this.logger.log(`🔧 Infosimples Service inicializado`);
    this.logger.log(`🔧 API: NFE (Unificada) - Modelo 55`);
    this.logger.log(`🔧 Endpoint: ${this.apiBase}`);
    this.logger.log(`🔧 Token: ${this.apiToken ? 'PRESENTE' : 'AUSENTE'}`);
  }

  /**
   * Consulta NF-e (Modelo 55) usando API NFE Unificada
   * @param chaveAcesso Chave de 44 dígitos da NF-e
   * @param timeout Tempo máximo em segundos
   */
  async consultNfe(chaveAcesso: string, timeout: number = 30): Promise<any> {
    try {
      this.logger.log(`🔍 Consultando NF-e: ${chaveAcesso.substring(0, 8)}...`);
      this.logger.log(`📊 Tipo: NFE (Unificada) - Modelo 55`);
      
      const response: AxiosResponse = await firstValueFrom(
        this.httpService.post(
          this.apiBase,
          new URLSearchParams({
            token: this.apiToken,
            timeout: timeout.toString(),
            nfe: chaveAcesso, // ⚠️ PARÂMETRO OBRIGATÓRIO: "nfe" (não "nfce")
            ignore_site_receipt: '1',
          }).toString(),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            timeout: (timeout + 5) * 1000,
          }
        )
      );

      this.logger.log(`✅ Consulta NFE realizada com sucesso`);
      this.logger.log(`📊 Código: ${response.data?.code} - ${response.data?.code_message}`);
      this.logger.log(`📦 Quantidade de itens retornados: ${response.data?.data_count || 0}`);

      // Log detalhado para debug da estrutura
      if (response.data?.data?.[0]) {
        this.logger.debug(`🔍 Estrutura da resposta:`);
        const primeiraNota = response.data.data[0];
        this.logger.debug(`   📄 Número: ${primeiraNota.numero || 'N/A'}`);
        this.logger.debug(`   🏭 Emitente: ${primeiraNota.emitente?.razao_social || 'N/A'}`);
        this.logger.debug(`   📦 Produtos: ${primeiraNota.produtos?.length || 0} itens`);
        if (primeiraNota.produtos?.[0]) {
          const primeiroProduto = primeiraNota.produtos[0];
          this.logger.debug(`   🛒 Primeiro produto: ${primeiroProduto.descricao || 'Sem nome'}`);
          this.logger.debug(`   🔢 EAN: ${primeiroProduto.ean_comercial || 'Não informado'}`);
        }
      }

      return response.data;
      
    } catch (error: any) {
      this.logger.error(`❌ Erro na consulta NFE: ${error.message}`);
      
      if (error.response) {
        this.logger.error(`📊 Status HTTP: ${error.response.status}`);
        this.logger.error(`📊 Código API: ${error.response.data?.code}`);
        this.logger.error(`📊 Mensagem: ${error.response.data?.code_message}`);
        this.logger.error(`📊 Erros: ${JSON.stringify(error.response.data?.errors)}`);
        
        // Se for erro 607 (parâmetro inválido), pode ser chave de NFC-e
        if (error.response.data?.code === 607) {
          this.logger.warn(`⚠️  Código 607: A chave pode ser de NFC-e (Modelo 65). Considere usar API NFC-e Unificada.`);
        }
      }
      
      throw error;
    }
  }

  /**
   * Testa conexão com API NFE usando chave inválida
   */
  async testConnection(): Promise<any> {
    try {
      this.logger.log('🔍 Testando conexão com API NFE Unificada...');
      
      const response = await firstValueFrom(
        this.httpService.post(
          this.apiBase,
          new URLSearchParams({
            token: this.apiToken,
            timeout: '5',
            nfe: '00000000000000000000000000000000000000000000',
            ignore_site_receipt: '1',
          }).toString(),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            timeout: 10000,
          }
        )
      );

      return {
        connected: true,
        message: 'API NFE (Unificada) respondendo',
        code: response.data?.code,
        code_message: response.data?.code_message,
        service: 'sefaz/nfe',
      };
      
    } catch (error: any) {
      // Mesmo com erro (chave inválida), a API está funcionando
      if (error.response) {
        return {
          connected: true,
          message: 'API NFE respondendo (erro esperado para chave inválida)',
          status: error.response.status,
          code: error.response.data?.code,
          code_message: error.response.data?.code_message,
          service: 'sefaz/nfe',
        };
      }
      
      return {
        connected: false,
        message: 'API NFE não respondeu',
        error: error.message,
        service: 'sefaz/nfe',
      };
    }
  }

  /**
   * Descobre serviços disponíveis na API (para debug)
   */
  async discoverServices(): Promise<any> {
    const services = ['sefaz/nfe', 'sefaz/nfce-unificada', 'sefaz/am/nfce'];
    
    const results = [];
    
    for (const service of services) {
      const endpoint = `https://api.infosimples.com/api/v2/consultas/${service}`;
      
      try {
        this.logger.log(`🔍 Testando serviço: ${service}`);
        
        const response = await firstValueFrom(
          this.httpService.post(
            endpoint,
            new URLSearchParams({
              token: this.apiToken,
              timeout: '3',
              nfe: '00000000000000000000000000000000000000000000',
              ignore_site_receipt: '1',
            }).toString(),
            {
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              timeout: 5000,
            }
          )
        );

        results.push({
          service: service,
          exists: true,
          status: 'SUCCESS',
          code: response.data?.code,
          endpoint: endpoint,
        });
        
      } catch (error: any) {
        if (error.response) {
          results.push({
            service: service,
            exists: error.response.status !== 404,
            status: error.response.status,
            message: error.response.data?.code_message,
            endpoint: endpoint,
          });
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return {
      discovery: results,
      recommended: 'Use "sefaz/nfe" para NF-e (Modelo 55) de qualquer estado',
    };
  }
}