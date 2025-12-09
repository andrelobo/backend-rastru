import { Controller, Get, Param, Res, HttpStatus, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { DanfeService } from './danfe.service';

@Controller('api/v1/danfe')
export class DanfeController {
  constructor(private readonly danfeService: DanfeService) {}

  @Get('html/:chave')
  async gerarHtml(@Param('chave') chave: string, @Res() res: Response) {
    try {
      const html = await this.danfeService.gerarHtml(chave);
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      if (error instanceof NotFoundException) {
        res.status(HttpStatus.NOT_FOUND).json({
          message: error.message,
        });
      } else {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          message: 'Erro ao gerar DANFE',
          error: error.message,
        });
      }
    }
  }

  @Get('pdf/:chave')
  async gerarPdf(@Param('chave') chave: string, @Res() res: Response) {
    try {
      const pdfBuffer = await this.danfeService.gerarPdf(chave);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="DANFE-${chave}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      if (error instanceof NotFoundException) {
        res.status(HttpStatus.NOT_FOUND).json({
          message: error.message,
        });
      } else {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          message: 'Erro ao gerar PDF',
          error: error.message,
        });
      }
    }
  }

  @Get('view/:chave')
  async viewDanfe(@Param('chave') chave: string, @Res() res: Response) {
    try {
      const html = await this.danfeService.gerarHtmlComTemplate(chave);
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      if (error instanceof NotFoundException) {
        res.status(HttpStatus.NOT_FOUND).json({
          message: error.message,
        });
      } else {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          message: 'Erro ao gerar visualização',
          error: error.message,
        });
      }
    }
  }
}