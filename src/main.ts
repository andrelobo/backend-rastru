// src/main.ts - VERSÃO CORRIGIDA
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // CORS
  app.enableCors();
  
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Rastru backend running on port ${port}`);
  console.log(`API disponível em: http://localhost:${port}/api/v1`);
}
bootstrap();