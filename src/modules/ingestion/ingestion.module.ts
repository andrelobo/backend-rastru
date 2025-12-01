import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { IngestionService } from './ingestion.service';
import { IngestionController } from './ingestion.controller';
import { Price, PriceSchema } from '../prices/schemas/price.schema';
import { Store, StoreSchema } from '../stores/schemas/store.schema';
import { Product, ProductSchema } from '../products/schemas/product.schema';
import { InfosimplesService } from '../infosimples/infosimples.service';
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Price.name, schema: PriceSchema }, { name: Store.name, schema: StoreSchema }, { name: Product.name, schema: ProductSchema }])
  ],
  controllers: [IngestionController],
  providers: [IngestionService, InfosimplesService]
})
export class IngestionModule {}
