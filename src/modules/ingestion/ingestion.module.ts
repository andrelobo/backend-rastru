import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { IngestionController } from './ingestion.controller';
import { IngestionService } from './ingestion.service';
import { InfosimplesModule } from '../infosimples/infosimples.module';
import { Store, StoreSchema } from '../stores/schemas/store.schema';
import { Product, ProductSchema } from '../products/schemas/product.schema';
import { Price, PriceSchema } from '../prices/schemas/price.schema';
import { FiscalDocumentModule } from '../fiscal-document/fiscal-document.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Store.name, schema: StoreSchema },
      { name: Product.name, schema: ProductSchema },
      { name: Price.name, schema: PriceSchema },
    ]),
    InfosimplesModule,
    FiscalDocumentModule,
  ],
  controllers: [IngestionController],
  providers: [IngestionService],
  exports: [IngestionService],
})
export class IngestionModule {}