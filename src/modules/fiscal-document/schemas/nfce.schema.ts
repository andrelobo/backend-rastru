// src/modules/fiscal-document/schemas/nfce.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Supplier } from '../../supplier/schemas/supplier.schema';

export type NFCeDocument = NFCe & Document;

@Schema({ timestamps: true })
export class NFCe {
  @Prop({ required: true, unique: true, index: true })
  chaveAcesso: string;

  @Prop({ required: true })
  numero: string;

  @Prop({ required: true })
  serie: string;

  @Prop({ required: true })
  dataEmissao: Date;

  @Prop({ required: true })
  valorTotal: number;

  @Prop({ type: Types.ObjectId, ref: 'Supplier', required: true })
  emitente: Supplier;

  @Prop({
    type: {
      cpf: { type: String, required: false },
      nome: { type: String, required: false },
    },
    required: false,
    _id: false,
  })
  destinatario?: {
    cpf?: string;
    nome?: string;
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

  @Prop([
    {
      tipo: { type: String, required: true },
      valor: { type: Number, required: true },
      _id: false,
    },
  ])
  formaPagamento: Array<{
    tipo: string;
    valor: number;
  }>;

  @Prop()
  qrCode: string;

  @Prop()
  informacoesAdicionais: string;

  @Prop({ default: 'pendente' })
  statusProcessamento: 'pendente' | 'processado' | 'erro';

  @Prop()
  erroProcessamento?: string;

  @Prop({ type: Object })
  rawData: Record<string, any>;

  @Prop({ default: true })
  ativo: boolean;
}

export const NFCeSchema = SchemaFactory.createForClass(NFCe);

NFCeSchema.index({ chaveAcesso: 1 });
NFCeSchema.index({ emitente: 1, dataEmissao: -1 });
NFCeSchema.index({ 'produtos.produto': 1 });