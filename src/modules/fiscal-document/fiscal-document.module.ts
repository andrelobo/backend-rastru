import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NFCe, NFCeSchema } from './schemas/nfce.schema';
import { NFe, NFeSchema } from './schemas/nfe.schema';
import { FiscalDocumentService } from './fiscal-document.service';
import { SupplierModule } from '../supplier/supplier.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: NFCe.name, schema: NFCeSchema },
      { name: NFe.name, schema: NFeSchema },
    ]),
    SupplierModule,
  ],
  providers: [FiscalDocumentService],
  exports: [FiscalDocumentService, MongooseModule],
})
export class FiscalDocumentModule {}
