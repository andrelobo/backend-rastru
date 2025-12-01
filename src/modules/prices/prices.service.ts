import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Price, PriceDocument } from './schemas/price.schema';
import { Store, StoreDocument } from '../stores/schemas/store.schema';
@Injectable()
export class PricesService {
  constructor(
    @InjectModel(Price.name) private priceModel: Model<PriceDocument>,
    @InjectModel(Store.name) private storeModel: Model<StoreDocument>
  ) {}
  async getHistoryByEan(ean: string) {
    const docs = await this.priceModel.find({ ean }).sort({ date: -1 }).limit(200).lean();
    return { count: docs.length, results: docs };
  }
  async getLowestByEan(ean: string) {
    const doc = await this.priceModel.findOne({ ean }).sort({ price: 1, date: -1 }).lean();
    if (!doc) return null;
    const store = await this.storeModel.findOne({ cnpj: doc.storeCnpj }).lean();
    return { product: doc.productName, price: doc.price, store: doc.storeName, neighborhood: doc.neighborhood, date: doc.date, storeLocation: store?.location };
  }
  async findNearbyLowest(ean: string, lat: number, lng: number, radiusKm = 10) {
    const prices = await this.priceModel.find({ ean }).lean();
    const results = [];
    for(const p of prices) {
      const s = await this.storeModel.findOne({ cnpj: p.storeCnpj }).lean();
      if(!s || !s.location || !s.location.coordinates) continue;
      const storeLat = s.location.coordinates[1];
      const storeLng = s.location.coordinates[0];
      const dist = haversine([lat,lng],[storeLat,storeLng]);
      if(dist > radiusKm) continue;
      results.push({ price: p.price, store: p.storeName, cnpj: p.storeCnpj, distance: dist, neighborhood: p.neighborhood, date: p.date });
    }
    results.sort((a,b)=>a.price - b.price);
    return results;
  }
}
function haversine([lat1,lon1],[lat2,lon2]) {
  const toRad = v => (v * Math.PI)/180;
  const R = 6371;
  const dLat = toRad(lat2-lat1);
  const dLon = toRad(lon2-lon1);
  const a = Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)*Math.sin(dLon/2);
  const c = 2*Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R*c;
}
