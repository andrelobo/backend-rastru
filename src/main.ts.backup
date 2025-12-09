import 'reflect-metadata'; // Must be the first import

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import * as rateLimit from 'express-rate-limit';
dotenv.config();
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  app.use(rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60000),
    max: Number(process.env.RATE_LIMIT_MAX || 60)
  }));
  await app.listen(process.env.PORT || 3000);
  console.log('Rastru backend running on port', process.env.PORT || 3000);
}
bootstrap();
