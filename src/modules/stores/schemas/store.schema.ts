import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
export type StoreDocument = Store & Document;
@Schema({ timestamps: true })
export class Store {
  @Prop({ index: true }) cnpj: string;
  @Prop({ required: true }) name: string;
  @Prop() fantasyName?: string;
  @Prop() address?: string;
  @Prop() neighborhood?: string;
  @Prop() city?: string;
  @Prop() state?: string;
  @Prop() phone?: string;
  @Prop({
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }
  }) location?: any;
}
export const StoreSchema = SchemaFactory.createForClass(Store);
StoreSchema.index({ location: '2dsphere' });
