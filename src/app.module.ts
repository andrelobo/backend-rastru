import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductsModule } from './modules/products/products.module';
import { StoresModule } from './modules/stores/stores.module';
import { PricesModule } from './modules/prices/prices.module';
import { InfosimplesModule } from './modules/infosimples/infosimples.module';
import { IngestionModule } from './modules/ingestion/ingestion.module';
import * as dotenv from 'dotenv';
import * as mongoose from 'mongoose'; // Import mongoose

dotenv.config();

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URI || 'mongodb://localhost:27017/rastru'),
    ProductsModule,
    StoresModule,
    PricesModule,
    InfosimplesModule,
    IngestionModule
  ],
  controllers: [],
  providers: []
})
export class AppModule implements OnModuleInit {
  private readonly logger = new Logger(AppModule.name);

  onModuleInit() {
    mongoose.connection.on('connected', () => {
      this.logger.log('MongoDB connected successfully');
    });
    mongoose.connection.on('error', (err) => {
      this.logger.error(`MongoDB connection error: ${err}`);
    });
    mongoose.connection.on('disconnected', () => {
      this.logger.warn('MongoDB disconnected');
    });
  }
}
