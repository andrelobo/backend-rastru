// src/modules/infosimples/infosimples.service.ts
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class InfosimplesService {
  private readonly baseUrl = 'https://api.infosimples.com/api/v2/consultas/nfce';
  private readonly token = process.env.INFOSIMPLES_TOKEN;

  async consultNfce(nfceKey: string, timeout = 120000) {
    // ✓ Validação da chave
    if (!nfceKey || nfceKey.length !== 44) {
      throw new HttpException(
        `Chave NFC-e inválida: ${nfceKey}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!this.token) {
      throw new HttpException(
        'Token Infosimples não configurado no .env',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const url = `${this.baseUrl}/complete`;

    try {
      const response = await axios.post(
        url,
        null, // Infosimples NÃO aceita body
        {
          params: {
            token: this.token,
            chave: nfceKey,
            timeout: timeout / 1000, // API usa segundos
          },
          timeout,
        },
      );

      const data = response.data;

      // ✓ A API só é sucesso se `code === 2000`
      if (data.code !== 2000) {
        throw new HttpException(
          data.code_message || 'Erro na consulta da NFC-e',
          HttpStatus.BAD_REQUEST,
        );
      }

      return data;

    } catch (error: any) {
      console.error('Erro na consulta Infosimples:', error?.response?.data || error);

      const message =
        error?.response?.data?.code_message ||
        error?.message ||
        'Erro ao consultar NFC-e';

      throw new HttpException(message, HttpStatus.BAD_REQUEST);
    }
  }
}
