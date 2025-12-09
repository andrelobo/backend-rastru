// src/modules/danfe/danfe.service.ts - VERSÃO SIMPLES E FUNCIONAL
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import { NFCe } from '../fiscal-document/schemas/nfce.schema';
import { NFe } from '../fiscal-document/schemas/nfe.schema';

@Injectable()
export class DanfeService {
  private storagePath: string;

  constructor(
    @InjectModel(NFCe.name) private nfceModel: Model<NFCe>,
    @InjectModel(NFe.name) private nfeModel: Model<NFe>,
  ) {
    this.storagePath = process.env.STORAGE_PATH || './storage/danfe';
    this.criarDiretorioStorage();
  }

  private criarDiretorioStorage() {
    if (!fs.existsSync(this.storagePath)) {
      fs.mkdirSync(this.storagePath, { recursive: true });
    }
  }

  async gerarHtml(chaveAcesso: string): Promise<string> {
    const documento = await this.buscarDocumento(chaveAcesso);
    return `<h1>DANFE - ${documento.chaveAcesso}</h1><p>Template básico</p>`;
  }

  async gerarPdf(chaveAcesso: string): Promise<Buffer> {
    throw new Error('PDF não implementado ainda');
  }

  async gerarHtmlComTemplate(chaveAcesso: string): Promise<string> {
    return this.gerarHtml(chaveAcesso);
  }

  private async buscarDocumento(chaveAcesso: string): Promise<NFCe | NFe> {
    let documento = await this.nfceModel.findOne({ chaveAcesso });
    if (documento) return documento;

    documento = await this.nfeModel.findOne({ chaveAcesso });
    if (documento) return documento;

    throw new NotFoundException(`Documento com chave ${chaveAcesso} não encontrado`);
  }

  private getHtmlPath(chaveAcesso: string): string {
    return path.join(this.storagePath, `${chaveAcesso}.html`);
  }

  private getPdfPath(chaveAcesso: string): string {
    return path.join(this.storagePath, `${chaveAcesso}.pdf`);
  }
}