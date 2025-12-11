import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Supplier extends Document {
  @Prop({ required: true, unique: true, index: true })
  cnpj: string;

  @Prop({ required: true })
  nome: string;

  @Prop()
  nomeFantasia: string;

  @Prop()
  inscricaoEstadual: string;

  @Prop()
  endereco: string;

  @Prop()
  telefone: string;

  @Prop()
  email: string;

  @Prop({ default: true })
  ativo: boolean;

  @Prop({ default: 0 })
  totalNotasProcessadas: number;

  @Prop({ type: Date, default: Date.now })
  ultimaAtualizacao: Date;

  @Prop({ type: Object })
  metadata: Record<string, any>;

  @Prop({
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] },
  })
  location?: any;
}

export const SupplierSchema = SchemaFactory.createForClass(Supplier);

SupplierSchema.index({ cnpj: 1 });
SupplierSchema.index({ nome: 'text', nomeFantasia: 'text' });
SupplierSchema.index({ location: '2dsphere' });