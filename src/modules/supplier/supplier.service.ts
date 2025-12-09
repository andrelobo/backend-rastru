import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Supplier } from './schemas/supplier.schema';

@Injectable()
export class SupplierService {
  constructor(
    @InjectModel(Supplier.name) private supplierModel: Model<Supplier>,
  ) {}

  async salvarOuAtualizar(data: {
    cnpj: string;
    nome: string;
    nomeFantasia?: string;
    endereco?: string;
    telefone?: string;
    email?: string;
    inscricaoEstadual?: string;
  }): Promise<Supplier> {
    const cnpjLimpo = data.cnpj.replace(/\D/g, '');

    const supplier = await this.supplierModel.findOneAndUpdate(
      { cnpj: cnpjLimpo },
      {
        $set: {
          nome: data.nome,
          nomeFantasia: data.nomeFantasia || data.nome,
          endereco: data.endereco,
          telefone: data.telefone,
          email: data.email,
          inscricaoEstadual: data.inscricaoEstadual,
          ultimaAtualizacao: new Date(),
        },
        $inc: { totalNotasProcessadas: 1 },
      },
      { upsert: true, new: true },
    );

    return supplier;
  }

  async buscarPorCNPJ(cnpj: string): Promise<Supplier | null> {
    const cnpjLimpo = cnpj.replace(/\D/g, '');
    return this.supplierModel.findOne({ cnpj: cnpjLimpo });
  }

  async listarFornecedoresAtivos(): Promise<Supplier[]> {
    return this.supplierModel.find({ ativo: true }).sort({ nome: 1 });
  }

  async desativarFornecedor(cnpj: string): Promise<Supplier | null> {
    const cnpjLimpo = cnpj.replace(/\D/g, '');
    return this.supplierModel.findOneAndUpdate(
      { cnpj: cnpjLimpo },
      { $set: { ativo: false } },
      { new: true }
    );
  }

  async contarFornecedores(): Promise<{ total: number; ativos: number }> {
    const total = await this.supplierModel.countDocuments();
    const ativos = await this.supplierModel.countDocuments({ ativo: true });
    return { total, ativos };
  }
}