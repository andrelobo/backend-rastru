// src/modules/fiscal-document/schemas/nfe.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Supplier } from '../../supplier/schemas/supplier.schema';

export type NFeDocument = NFe & Document;

@Schema({ timestamps: true })
export class NFe {
  @Prop({ required: true, unique: true, index: true })
  chaveAcesso: string;

  @Prop({ required: true })
  numero: string;

  @Prop({ required: true })
  serie: string;

  @Prop({ required: true })
  dataEmissao: Date;

  @Prop()
  dataSaidaEntrada?: Date;

  @Prop({ required: true })
  valorTotal: number;

  @Prop({ type: Types.ObjectId, ref: 'Supplier', required: true })
  emitente: Supplier;

  @Prop({
    type: {
      cpf: { type: String, required: false },
      cnpj: { type: String, required: false },
      nome: { type: String, required: true },
      inscricaoEstadual: { type: String, required: false },
      endereco: {
        type: {
          logradouro: { type: String, required: false },
          numero: { type: String, required: false },
          complemento: { type: String, required: false },
          bairro: { type: String, required: false },
          municipio: { type: String, required: false },
          uf: { type: String, required: false },
          cep: { type: String, required: false },
        },
        required: false,
        _id: false,
      },
    },
    required: false,
    _id: false,
  })
  destinatario?: {
    cpf?: string;
    cnpj?: string;
    nome: string;
    inscricaoEstadual?: string;
    endereco?: {
      logradouro?: string;
      numero?: string;
      complemento?: string;
      bairro?: string;
      municipio?: string;
      uf?: string;
      cep?: string;
    };
  };

  @Prop({
    type: {
      cnpj: { type: String, required: false },
      nome: { type: String, required: false },
      placaVeiculo: { type: String, required: false },
      ufVeiculo: { type: String, required: false },
    },
    required: false,
    _id: false,
  })
  transportadora?: {
    cnpj?: string;
    nome?: string;
    placaVeiculo?: string;
    ufVeiculo?: string;
  };

  @Prop([
    {
      produto: { type: Types.ObjectId, ref: 'Product', required: false },
      codigo: { type: String, required: true },
      descricao: { type: String, required: true },
      quantidade: { type: Number, required: true },
      unidade: { type: String, required: true },
      valorUnitario: { type: Number, required: true },
      valorTotal: { type: Number, required: true },
      ncm: { type: String, required: false },
      cest: { type: String, required: false },
      _id: false,
    },
  ])
  produtos: Array<{
    produto?: Types.ObjectId;
    codigo: string;
    descricao: string;
    quantidade: number;
    unidade: string;
    valorUnitario: number;
    valorTotal: number;
    ncm?: string;
    cest?: string;
  }>;

  @Prop({
    type: {
      valorProdutos: { type: Number, required: false },
      valorFrete: { type: Number, required: false },
      valorSeguro: { type: Number, required: false },
      valorDesconto: { type: Number, required: false },
      valorIpi: { type: Number, required: false },
      valorIcms: { type: Number, required: false },
      valorPis: { type: Number, required: false },
      valorCofins: { type: Number, required: false },
      valorOutros: { type: Number, required: false },
    },
    required: false,
    _id: false,
  })
  totais?: {
    valorProdutos?: number;
    valorFrete?: number;
    valorSeguro?: number;
    valorDesconto?: number;
    valorIpi?: number;
    valorIcms?: number;
    valorPis?: number;
    valorCofins?: number;
    valorOutros?: number;
  };

  @Prop([
    {
      tipo: { type: String, required: true },
      valor: { type: Number, required: true },
      troco: { type: Number, required: false },
      _id: false,
    },
  ])
  formaPagamento: Array<{
    tipo: string;
    valor: number;
    troco?: number;
  }>;

  @Prop()
  informacoesComplementares?: string;

  @Prop()
  informacoesFisco?: string;

  @Prop({ default: 'pendente' })
  statusProcessamento: 'pendente' | 'processado' | 'erro';

  @Prop()
  erroProcessamento?: string;

  @Prop({ type: Object })
  rawData: Record<string, any>;

  @Prop({ default: true })
  ativo: boolean;
}

export const NFeSchema = SchemaFactory.createForClass(NFe);

NFeSchema.index({ chaveAcesso: 1 });
NFeSchema.index({ emitente: 1, dataEmissao: -1 });
NFeSchema.index({ destinatario: 1 });
NFeSchema.index({ 'produtos.produto': 1 });