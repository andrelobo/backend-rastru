import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Store, StoreDocument } from './schemas/store.schema';
@Injectable()
export class StoresService {
  constructor(@InjectModel(Store.name) private storeModel: Model<StoreDocument>) {}
  async getByCnpj(cnpj: string) {
    return this.storeModel.findOne({ cnpj }).lean();
  }
  async findNearby(lat: number, lng: number, radiusKm = 10) {
    const meters = radiusKm * 1000;
    const stores = await this.storeModel.find({
      location: {
        $nearSphere: {
          $geometry: { type: "Point", coordinates: [lng, lat] },
          $maxDistance: meters
        }
      }
    }).limit(100).lean();
    return stores;
  }
}
