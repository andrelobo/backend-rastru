export interface InfosimplesNFCeResponse {
  code: number;
  status: string;
  data: {
    chave: string;
    numero: string;
    serie: string;
    data_emissao: string;
    valor_total: number;
    emitente: {
      cnpj: string;
      razao_social: string;
      nome_fantasia: string;
      inscricao_estadual: string;
      endereco: {
        logradouro: string;
        numero: string;
        complemento: string;
        bairro: string;
        municipio: string;
        uf: string;
        cep: string;
      };
    };
    destinatario: {
      cpf?: string;
      cnpj?: string;
      nome: string;
    };
    produtos: Array<{
      codigo: string;
      descricao: string;
      quantidade: number;
      unidade: string;
      valor_unitario: number;
      valor_total: number;
      ncm?: string;
      cest?: string;
    }>;
    forma_pagamento: Array<{
      tipo: string;
      valor: number;
    }>;
    informacoes_adicionais?: string;
    qr_code?: string;
  };
  metadata?: {
    consulta_id: string;
    tempo_processamento: number;
  };
}