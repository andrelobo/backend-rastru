import { Module } from '@nestjs/common';
import { DanfeService } from './danfe.service';
import { DanfeController } from './danfe.controller';
import { FiscalDocumentModule } from '../fiscal-document/fiscal-document.module';

@Module({
  imports: [FiscalDocumentModule],
  controllers: [DanfeController],
  providers: [DanfeService],
  exports: [DanfeService],
})
export class DanfeModule {}
