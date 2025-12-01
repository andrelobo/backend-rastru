import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PriceDocument = Price & Document;

@Schema({ timestamps: true })
export class Price {
  @Prop({ index: true }) ean: string;
  @Prop({ required: true }) productName: string;
  @Prop({ required: true }) storeCnpj: string;
  @Prop({ required: true }) storeName: string;
  @Prop() neighborhood?: string;
  @Prop({ required: true }) price: number;
  @Prop({ required: true }) source: string;
  @Prop({ type: Date, index: true }) date: Date;
  @Prop() nfceKey?: string;
  @Prop({ type: Object }) raw?: Record<string, any>;
}

export const PriceSchema = SchemaFactory.createForClass(Price);
PriceSchema.index({ ean: 1, price: 1 });
PriceSchema.index({ storeCnpj: 1, date: -1 });
