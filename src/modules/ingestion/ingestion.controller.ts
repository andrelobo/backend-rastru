import { Controller, Post, Body } from '@nestjs/common';
import { IngestionService } from './ingestion.service';
@Controller('api/ingest')
export class IngestionController {
  constructor(private service: IngestionService) {}
  @Post('nfce')
  async ingest(@Body() body: { nfce: string }) {
    return this.service.ingestNfceKey(body.nfce);
  }
}
