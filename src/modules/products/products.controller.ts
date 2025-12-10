import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('product')
export class ProductsController {
  constructor(private service: ProductsService) {}

  // ROTA ESPECÍFICA PRIMEIRO (para evitar conflito com :ean)
  @Get('search')
  async search(@Query('q') q: string) {
    return this.service.searchByName(q);
  }

  // ROTA COM PARÂMETRO DEPOIS
  @Get(':ean')
  async getByEan(@Param('ean') ean: string) {
    return this.service.getByEan(ean);
  }
}