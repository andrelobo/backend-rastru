import { 
  Controller, 
  Post, 
  Body, 
  Get, 
  HttpStatus, 
  HttpException,
  BadRequestException,
  Inject,
  Param
} from '@nestjs/common';
import { IngestionService } from './ingestion.service';
import { InfosimplesService } from '../infosimples/infosimples.service';

@Controller('ingest')
export class IngestionController {
  constructor(
    private readonly ingestionService: IngestionService,
    @Inject(InfosimplesService)
    private readonly infosimplesService: InfosimplesService,
  ) {}

  @Post('nfce')
  async ingestNfce(@Body() body: any) {  // Mudado de IngestNfceDto para any
    try {
      if (!body || !body.chaveAcesso) {
        throw new BadRequestException('Chave de acesso é obrigatória');
      }
      
      // Usa o novo método unificado
      return await this.ingestionService.ingestDocument(body.chaveAcesso, body.timeout);
    } catch (error: any) {
      throw new HttpException(
        {
          message: error.message || 'Erro ao processar documento fiscal',
          error: error.response?.error || 'Internal Server Error',
          statusCode: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('auto')
  async ingestAuto(@Body() body: any) {  // Mudado de IngestAutoDto para any
    try {
      if (!body || !body.qrCode) {
        throw new BadRequestException('QR Code é obrigatório');
      }
      
      // A lógica de extração da chave fica no serviço
      return await this.ingestionService.processarAutomaticamente(body.qrCode, body.timeout);
    } catch (error: any) {
      throw new HttpException(
        {
          message: error.message || 'Erro ao processar documento via QR Code',
          error: error.response?.error || 'Internal Server Error',
          statusCode: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('test-db')
  async testDb() {
    return this.ingestionService.testarBanco();
  }

  @Get('test-nfce-api')
  async testNfceApi() {
    return this.infosimplesService.testConnection();
  }

  @Get('debug-raw/:chave')
  async debugRaw(@Param('chave') chave: string) {
    try {
      // Chama a API diretamente para ver resposta bruta
      const rawData = await this.infosimplesService.consultNfe(chave, 30);
      
      return {
        success: true,
        chave,
        rawResponse: rawData,
        // Extrair estrutura da primeira nota
        nota: rawData.data?.[0] || null,
        produtos: rawData.data?.[0]?.produtos || [],
        produtoCount: rawData.data?.[0]?.produtos?.length || 0,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        response: error.response?.data,
      };
    }
  }

  @Get('health')
  async healthCheck() {
    try {
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          mongodb: await this.ingestionService.verificarConexaoMongoDB(),
          infosimples: await this.ingestionService.verificarConexaoInfosimples(),
          storage: await this.ingestionService.verificarStorage(),
        },
        version: process.env.npm_package_version || '1.0.0',
      };
    } catch (error: any) {
      throw new HttpException(
        { 
          status: 'unhealthy', 
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}