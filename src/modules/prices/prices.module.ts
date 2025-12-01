import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Price, PriceSchema } from './schemas/price.schema';
import { PricesService } from './prices.service';
import { PricesController } from './prices.controller';
import { Store, StoreSchema } from '../stores/schemas/store.schema';
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Price.name, schema: PriceSchema }, { name: Store.name, schema: StoreSchema }])
  ],
  controllers: [PricesController],
  providers: [PricesService],
  exports: [PricesService]
})
export class PricesModule {}
