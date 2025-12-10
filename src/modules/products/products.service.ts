import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';
import { Price, PriceDocument } from '../prices/schemas/price.schema';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Price.name) private priceModel: Model<PriceDocument>
  ) {}

  async getByEan(ean: string) {
    const product = await this.productModel.findOne({ ean }).lean();
    
    if (!product) {
      throw new NotFoundException(`Produto com EAN ${ean} não encontrado`);
    }

    const prices = await this.priceModel
      .find({ ean })
      .sort({ date: -1 })
      .limit(100)
      .lean();

    return {
      product,
      prices: prices.map(price => ({
        purchasePrice: price.price,
        storeName: price.storeName,
        purchaseDate: price.date,
        nfceKey: price.nfceKey,
      })),
      count: prices.length,
    };
  }

  async searchByName(q: string) {
    if (!q || q.trim().length < 2) {
      return [];
    }
    
    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const products = await this.productModel
      .find({ name: regex })
      .limit(50)
      .lean();

    return products.map(product => ({
      ean: product.ean,
      name: product.name,
      brand: product.brand,
      category: product.category,
    }));
  }
}