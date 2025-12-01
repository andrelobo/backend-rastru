import { Module, Global } from '@nestjs/common';
import { InfosimplesService } from './infosimples.service';
@Global()
@Module({
  providers: [
    {
      provide: InfosimplesService,
      useFactory: () => {
        const base = process.env.INFOSIMPLES_API_BASE || 'https://api.infosimples.com/api/v2/consultas';
        const token = process.env.INFOSIMPLES_API_TOKEN || '';
        return new InfosimplesService(base, token);
      }
    }
  ],
  exports: [InfosimplesService]
})
export class InfosimplesModule {}
