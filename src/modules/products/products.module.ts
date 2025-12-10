import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { Product, ProductSchema } from './schemas/product.schema';
import { Price, PriceSchema } from '../prices/schemas/price.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: Price.name, schema: PriceSchema },  // ← ADICIONADO para usar no service
    ]),
  ],
  controllers: [ProductsController],  // ← ADICIONADO
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}