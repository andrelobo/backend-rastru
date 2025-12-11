import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Supplier } from '../supplier/schemas/supplier.schema';
import { NFe } from './schemas/nfe.schema';
import { NFCe } from './schemas/nfce.schema';

@Injectable()
export class FiscalDocumentService {
  constructor(
    @InjectModel(Supplier.name) private supplierModel: Model<Supplier>,
    @InjectModel(NFe.name) private nfeModel: Model<NFe>,
    @InjectModel(NFCe.name) private nfceModel: Model<NFCe>,
  ) {}

  /**
   * Processa e salva os dados de um documento fiscal (NFe ou NFCe)
   * a partir da resposta da API Infosimples.
   *
   * @param fiscalDocumentData O objeto 'nota' ou 'data[0]' da resposta da Infosimples.
   * @returns O documento do fornecedor e o documento fiscal salvo.
   */
  async processAndSave(fiscalDocumentData: any): Promise<any> {
    console.log('FiscalDocumentService: processAndSave called');
    // Lógica para extrair dados do fornecedor e do documento fiscal
    const supplierData = this.extractSupplierData(fiscalDocumentData);
    
    // 1. Salvar ou atualizar o fornecedor
    const supplier = await this.upsertSupplier(supplierData);

    // 2. Determinar se é NFe ou NFCe e salvar o documento completo
    const savedDocument = await this.saveFiscalDocument(fiscalDocumentData, supplier);

    return { supplier, savedDocument };
  }

  private extractSupplierData(data: any): any {
    // Placeholder: Extrair dados do emitente para o fornecedor
    const emitente = data.emitente;
    return {
      cnpj: emitente.cnpj,
      nome: emitente.nome,
      nomeFantasia: emitente.nome_fantasia,
      inscricaoEstadual: emitente.ie,
      endereco: `${emitente.endereco}, ${emitente.bairro}, ${emitente.municipio} - ${emitente.uf}`,
      // Adicionar lógica para extrair e formatar a localização (geospatial)
    };
  }

  private async upsertSupplier(supplierData: any): Promise<Supplier> {
    // Placeholder: Lógica para salvar ou atualizar o fornecedor no banco de dados
    // usando o supplierModel.
    const cnpjLimpo = supplierData.cnpj.replace(/\D/g, '');
    
    const supplier = await this.supplierModel.findOneAndUpdate(
      { cnpj: cnpjLimpo },
      {
        $set: {
          nome: supplierData.nome,
          nomeFantasia: supplierData.nomeFantasia || supplierData.nome,
          endereco: supplierData.endereco,
          inscricaoEstadual: supplierData.inscricaoEstadual,
          ultimaAtualizacao: new Date(),
        },
        $inc: { totalNotasProcessadas: 1 },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    return supplier;
  }

  private async saveFiscalDocument(data: any, supplier: Supplier): Promise<NFe | NFCe> {
    // Placeholder: Lógica para salvar o documento fiscal completo
    const model = data.nfe?.modelo === '55' ? this.nfeModel : this.nfceModel;
    
    const documentToSave = new model({
      ...data,
      supplier: supplier._id, // Associar o fornecedor
      processingStatus: 'PROCESSED',
    });

    return documentToSave.save();
  }
}
