import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
export type ProductDocument = Product & Document;
@Schema({ timestamps: true })
export class Product {
  @Prop({ index: true }) ean: string;
  @Prop() sku?: string;
  @Prop({ required: true }) name: string;
  @Prop() brand?: string;
  @Prop() ncm?: string;
  @Prop({ type: Object }) attributes?: Record<string, any>;
  @Prop({ default: 0 }) hits: number;
}
export const ProductSchema = SchemaFactory.createForClass(Product);
