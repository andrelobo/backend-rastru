import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Price, PriceDocument } from './schemas/price.schema';

@Injectable()
export class PricesService {
  constructor(
    @InjectModel(Price.name) private priceModel: Model<PriceDocument>,
  ) {}
  
  async getPriceHistory(ean: string) {
    return this.priceModel
      .find({ ean })
      .sort({ date: -1 })
      .limit(100)
      .lean();
  }
  
  async getLowestPrice(ean: string) {
    return this.priceModel
      .findOne({ ean })
      .sort({ price: 1 })
      .lean();
  }
  
  async getNearbyPrices(ean: string, lat: number, lng: number, radius: number) {
    // Implementação básica - para geolocalização real, precisaria de índice 2dsphere
    // Por enquanto retorna todos os preços do produto
    return this.priceModel.find({ ean }).lean();
    
    // Para implementação futura com geolocalização:
    /*
    return this.priceModel.find({
      ean,
      latitude: { $exists: true, $ne: null },
      longitude: { $exists: true, $ne: null },
      $where: `function() {
        const R = 6371; // Raio da Terra em km
        const dLat = (${lat} - this.latitude) * Math.PI / 180;
        const dLon = (${lng} - this.longitude) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(this.latitude * Math.PI / 180) * Math.cos(${lat} * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        return distance <= ${radius};
      }`
    }).lean();
    */
  }
}