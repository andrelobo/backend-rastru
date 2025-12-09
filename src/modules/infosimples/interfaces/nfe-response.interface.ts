export interface InfosimplesNFeResponse {
  code: number;
  status: string;
  data: {
    chave: string;
    numero: string;
    serie: string;
    data_emissao: string;
    data_saida_entrada?: string;
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
        telefone?: string;
      };
    };
    destinatario: {
      cpf?: string;
      cnpj?: string;
      nome: string;
      inscricao_estadual?: string;
      endereco: {
        logradouro: string;
        numero: string;
        complemento: string;
        bairro: string;
        municipio: string;
        uf: string;
        cep: string;
        telefone?: string;
      };
    };
    transportadora?: {
      cnpj: string;
      nome: string;
      placa_veiculo?: string;
      uf_veiculo?: string;
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
      icms?: {
        situacao_tributaria: string;
        base_calculo: number;
        aliquota: number;
        valor: number;
      };
      ipi?: {
        situacao_tributaria: string;
        base_calculo: number;
        aliquota: number;
        valor: number;
      };
    }>;
    totais: {
      valor_produtos: number;
      valor_frete: number;
      valor_seguro: number;
      valor_desconto: number;
      valor_ipi: number;
      valor_icms: number;
      valor_pis: number;
      valor_cofins: number;
      valor_outros: number;
      valor_total_nota: number;
    };
    forma_pagamento: Array<{
      tipo: string;
      valor: number;
      troco?: number;
    }>;
    informacoes_complementares?: string;
    informacoes_fisco?: string;
  };
  metadata?: {
    consulta_id: string;
    tempo_processamento: number;
  };
}