import { Controller, Get, Param, Query } from '@nestjs/common';
import { StoresService } from './stores.service';
@Controller('api/store')
export class StoresController {
  constructor(private service: StoresService) {}
  @Get(':cnpj')
  async getByCnpj(@Param('cnpj') cnpj: string) {
    return this.service.getByCnpj(cnpj);
  }
  @Get('/nearby')
  async nearby(@Query('lat') lat: string, @Query('lng') lng: string, @Query('radius') radius: string) {
    return this.service.findNearby(Number(lat), Number(lng), Number(radius || 10));
  }
}
