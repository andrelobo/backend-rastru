import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PriceDocument = Price & Document;

@Schema({ 
  timestamps: true,
  collection: 'prices'
})
export class Price {
  @Prop({ index: true, required: true }) 
  ean: string;
  
  @Prop({ required: true })
  productName: string;
  
  @Prop({ required: true, index: true })
  storeCnpj: string;
  
  @Prop({ required: true })
  storeName: string;
  
  @Prop()
  neighborhood?: string;
  
  @Prop()
  city?: string;
  
  @Prop()
  state?: string;
  
  @Prop()
  latitude?: number;
  
  @Prop()
  longitude?: number;
  
  @Prop({ required: true })
  price: number;
  
  @Prop({ default: 'nfce' })
  source: string;
  
  @Prop({ type: Date, index: true, required: true })
  date: Date;
  
  @Prop()
  nfceKey?: string;
  
  @Prop()
  quantity?: number;
  
  @Prop()
  unit?: string;
  
  @Prop()
  purchasePrice?: number;
  
  @Prop()
  salePrice?: number;
  
  @Prop({ default: 1 })
  confidence?: number;
  
  @Prop()
  collector?: string;
  
  @Prop({ type: Object })
  raw?: Record<string, any>;
}

export const PriceSchema = SchemaFactory.createForClass(Price);

// Índices
PriceSchema.index({ ean: 1, price: 1 });
PriceSchema.index({ storeCnpj: 1, date: -1 });
PriceSchema.index({ ean: 1, date: -1 });
PriceSchema.index({ source: 1 });
PriceSchema.index({ city: 1, state: 1 });
PriceSchema.index({ ean: 1, storeCnpj: 1, date: -1 });

// Índice 2dsphere para geolocalização (descomente quando implementar)
// PriceSchema.index({ location: '2dsphere' });