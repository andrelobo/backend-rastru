import { Controller, Get, Param, Query } from '@nestjs/common';
import { PricesService } from './prices.service';
@Controller('api/price')
export class PricesController {
  constructor(private service: PricesService) {}
  @Get('history/:ean')
  async history(@Param('ean') ean: string) {
    return this.service.getHistoryByEan(ean);
  }
  @Get('lowest/:ean')
  async lowest(@Param('ean') ean: string) {
    return this.service.getLowestByEan(ean);
  }
  @Get('nearby')
  async nearby(@Query('ean') ean: string, @Query('lat') lat: string, @Query('lng') lng: string, @Query('radius') radius: string) {
    return this.service.findNearbyLowest(ean, Number(lat), Number(lng), Number(radius || 10));
  }
}
