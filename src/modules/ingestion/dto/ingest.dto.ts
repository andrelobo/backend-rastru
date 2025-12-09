export class IngestNfceDto {
  chaveAcesso: string;
  timeout?: number;
}

export class IngestAutoDto {
  qrCode: string;
  timeout?: number;
}

export class HealthCheckDto {
  component?: string;
}
