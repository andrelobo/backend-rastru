import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ProductDocument, Product } from './schemas/product.schema';
import { Price, PriceDocument } from '../prices/schemas/price.schema';
@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Price.name) private priceModel: Model<PriceDocument>
  ) {}
  async getByEan(ean: string) {
    const product = await this.productModel.findOne({ ean }).lean();
    const prices = await this.priceModel.find({ ean }).sort({ date: -1 }).limit(100).lean();
    return { product, prices };
  }
  async searchByName(q: string) {
    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const products = await this.productModel.find({ name: regex }).limit(50).lean();
    return products;
  }
}
