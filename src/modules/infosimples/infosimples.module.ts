import { Module, Global } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { InfosimplesService } from './infosimples.service';

@Global()
@Module({
  imports: [
    HttpModule.register({
      timeout: 60000, // 60 segundos timeout padrão
      maxRedirects: 5,
    }),
  ],
  providers: [InfosimplesService],
  exports: [InfosimplesService]
})
export class InfosimplesModule {}