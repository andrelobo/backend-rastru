// src/modules/infosimples/infosimples.module.ts
import { Module, Global } from '@nestjs/common';
import { InfosimplesService } from './infosimples.service';

@Global()
@Module({
  providers: [
    {
      provide: 'INFOSIMPLES_CONFIG',
      useValue: {
        base: process.env.INFOSIMPLES_API_BASE || 'https://api.infosimples.com/api/v2/consultas',
        token: process.env.INFOSIMPLES_API_TOKEN || '',
      }
    },
    {
      provide: InfosimplesService,
      useFactory: (config: { base: string; token: string }) => {
        console.log('Configurando InfosimplesService com:', config.base);
        return new InfosimplesService(config.base, config.token);
      },
      inject: ['INFOSIMPLES_CONFIG']
    }
  ],
  exports: [InfosimplesService]
})
export class InfosimplesModule {}