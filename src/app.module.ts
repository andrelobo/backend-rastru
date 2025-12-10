import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { IngestionModule } from './modules/ingestion/ingestion.module';
import { ProductsModule } from './modules/products/products.module';
import { PricesModule } from './modules/prices/prices.module';
import { StoresModule } from './modules/stores/stores.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.MONGO_URI || 'mongodb://localhost:27017/rastru'),
    IngestionModule,
    ProductsModule,    // ← ADICIONADO
    PricesModule,      // ← ADICIONADO (se existir)
    StoresModule,      // ← ADICIONADO (se existir)
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}