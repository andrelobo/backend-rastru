import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProductsService } from './products.service';
@Controller('api/product')
export class ProductsController {
  constructor(private service: ProductsService) {}
  @Get(':ean')
  async getByEan(@Param('ean') ean: string) {
    return this.service.getByEan(ean);
  }
  @Get('/search')
  async search(@Query('q') q: string) {
    return this.service.searchByName(q);
  }
}
