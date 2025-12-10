import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NFCe, NFCeSchema } from './schemas/nfce.schema';
import { NFe, NFeSchema } from './schemas/nfe.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: NFCe.name, schema: NFCeSchema },
      { name: NFe.name, schema: NFeSchema },
    ]),
  ],
  exports: [MongooseModule], // ← ESSENCIAL!
})
export class FiscalDocumentModule {}
