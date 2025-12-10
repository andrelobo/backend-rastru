import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InfosimplesService } from '../infosimples/infosimples.service';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Store, StoreDocument } from '../stores/schemas/store.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { Price, PriceDocument } from '../prices/schemas/price.schema';

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);
  private readonly useRealService: boolean;

  constructor(
    private infosimplesService: InfosimplesService,
    @InjectModel(Store.name) private storeModel: Model<StoreDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Price.name) private priceModel: Model<PriceDocument>,
  ) {
    const token = process.env.INFOSIMPLES_API_TOKEN || '';
    
    // Validação simplificada
    const hasValidToken = token && token.length > 20 && !token.includes('seu_token');
    
    this.useRealService = hasValidToken;
    
    this.logger.log(`🔧 === CONFIGURAÇÃO INFOSIMPLES ===`);
    this.logger.log(`🔧 Token: ${token ? 'PRESENTE' : 'AUSENTE'}`);
    this.logger.log(`🔧 Comprimento: ${token.length} chars`);
    this.logger.log(`🔧 Modo: ${this.useRealService ? 'REAL (NFE Unificada)' : 'MOCK'}`);
    this.logger.log(`🔧 ===============================`);
  }

  /**
   * Processa NF-e usando API NFE Unificada
   */
  async processarNFCe(chaveAcesso: string, timeout?: number) {
    this.logger.log(`📥 Processando NF-e: ${chaveAcesso ? chaveAcesso.substring(0, 8) : 'NULL'}...`);
    
    // Validação
    if (!chaveAcesso) {
      throw new BadRequestException('Chave de acesso é obrigatória');
    }
    
    if (chaveAcesso.length !== 44) {
      throw new BadRequestException(`Chave deve ter 44 dígitos. Recebido: ${chaveAcesso.length}`);
    }
    
    if (!/^\d+$/.test(chaveAcesso)) {
      throw new BadRequestException('Chave deve conter apenas números');
    }

    this.logger.log(`🔧 Usando modo: ${this.useRealService ? 'REAL (NFE Unificada)' : 'MOCK'}`);
    this.logger.log(`🔧 Modelo detectado: ${this.detectarModelo(chaveAcesso)}`);
    
    if (this.useRealService) {
      try {
        this.logger.log('🔍 Tentando conectar com NFE Unificada...');
        const result = await this.processarComInfosimplesReal(chaveAcesso, timeout);
        // Salvar no banco de dados
        await this.salvarNoBanco(chaveAcesso, result);
        return result;
      } catch (error: any) {
        this.logger.error(`❌ Erro NFE Unificada: ${error.message}`);
        this.logger.warn('🔄 Fazendo fallback para mock...');
        const mockResult = this.processarComoMock(chaveAcesso);
        await this.salvarNoBanco(chaveAcesso, mockResult);
        return mockResult;
      }
    } else {
      this.logger.warn('⚠️ Usando MOCK - Configure token Infosimples válido para serviço real');
      const mockResult = this.processarComoMock(chaveAcesso);
      await this.salvarNoBanco(chaveAcesso, mockResult);
      return mockResult;
    }
  }

  /**
   * Processa com API NFE Unificada REAL
   */
 
private async processarComInfosimplesReal(chaveAcesso: string, timeout?: number) {
  this.logger.log('🔍 Consultando API NFE Unificada...');
  
  const dados = await this.infosimplesService.consultNfe(chaveAcesso, timeout);
  
  if (!dados.data || dados.data.length === 0) {
    throw new Error('API não retornou dados da NF-e');
  }
  
  const nota = dados.data[0];
  
  // ⚠️ IMPORTANTE: Produtos estão em resumida.produtos, não produtos
  const produtosRaw = nota.resumida?.produtos || [];
  
  // Processar produtos
  const produtos = produtosRaw.map((prod: any, index: number) => {
    // Converter valores brasileiros (1.234,56) para float
    const quantidade = parseFloat(prod.quantidade?.replace('.', '').replace(',', '.') || '1');
    const valorUnitario = parseFloat(prod.valor_unidade?.replace('.', '').replace(',', '.') || '0');
    const valorTotal = parseFloat(prod.valor_produto?.replace('.', '').replace(',', '.') || '0');
    
    return {
      nome: prod.descricao || `Produto ${index + 1}`,
      ean: null, // NF-e não tem EAN
      quantidade: quantidade,
      valor: valorUnitario,
      valor_total: valorTotal,
      unidade: prod.unidade_comercial || 'UN',
      marca: 'Desconhecida',
      categoria: 'Desconhecida',
      numero_item: prod.num || index + 1,
      
      // Campos para rastreamento
      produto_id: `nf_${chaveAcesso.substring(0, 12)}_${prod.num || index + 1}`,
      descricao_completa: prod.descricao || '',
    };
  });
  
  return {
    message: 'NF-e processada com SUCESSO via NFE Unificada',
    status: 'sucesso_real',
    chaveAcesso,
    dados: {
      numero: nota.numero || 'N/A',
      serie: nota.serie || 'N/A',
      dataEmissao: nota.data_emissao || new Date().toISOString(),
      valorTotal: parseFloat(nota.resumida?.valor_total?.replace('.', '').replace(',', '.') || '0'),
      modelo: 'NF-e',
      
      // Emitente
      emitente: nota.emitente?.nome || 'N/A',
      cnpjEmitente: nota.emitente?.cnpj || this.extrairCNPJ(chaveAcesso),
      cidade: nota.emitente?.municipio || 'Desconhecida',
      uf: nota.emitente?.uf || this.extrairEstado(chaveAcesso.substring(0, 2)),
      
      // Produtos
      produtos,
      produtosCount: produtos.length,
      
      // Informações adicionais
      ambiente: nota.nfe?.situacao_ambiente || 'Produção',
      protocolo: nota.nfe?.eventos?.[0]?.protocolo || 'N/A',
      chave: nota.chave_acesso || chaveAcesso,
    },
    timestamp: new Date().toISOString(),
    api: 'nf-e-unificada',
    observacao: 'NF-e (Modelo 55) tem dados limitados. Para EAN completo, use NFC-e (Modelo 65).',
  };
}


  /**
   * Salva dados no banco (atualizado para estrutura NFE)
   */
  private async salvarNoBanco(chaveAcesso: string, dados: any) {
    try {
      this.logger.log(`💾 === INICIANDO SALVAMENTO NO BANCO ===`);
      this.logger.log(`📋 NF-e: ${chaveAcesso.substring(0, 8)}...`);
      this.logger.log(`📦 Total de produtos: ${dados.dados?.produtos?.length || 0}`);
      this.logger.log(`🔧 Fonte: ${dados.status === 'sucesso_real' ? 'NFE Unificada' : 'MOCK'}`);
      
      // Extrair CNPJ da chave
      const cnpj = this.extrairCNPJ(chaveAcesso);
      this.logger.log(`🏪 CNPJ extraído: ${cnpj}`);
      
      // Extrair dados da nota para a loja
      const storeData = {
        cnpj: cnpj,
        name: dados.dados?.emitente || `Loja ${cnpj}`,
        city: dados.dados?.cidade || 'Desconhecida',
        state: dados.dados?.uf || this.extrairEstado(chaveAcesso.substring(0, 2)),
      };

      this.logger.log(`🏪 Criando/Atualizando loja: ${storeData.name}`);
      
      // Upsert da loja
      const store = await this.storeModel.findOneAndUpdate(
        { cnpj: storeData.cnpj },
        { $set: storeData },
        { upsert: true, new: true }
      );
      
      this.logger.log(`✅ Loja salva: ${store.name} (ID: ${store._id})`);

      // Processar produtos se existirem
      const produtos = dados.dados?.produtos || [];
      let produtosSalvos = 0;
      let precosSalvos = 0;

      if (produtos.length > 0) {
        this.logger.log(`🛒 Processando ${produtos.length} produtos...`);
        
        for (const [index, produto] of produtos.entries()) {
          try {
            // Para NFE, EAN pode estar em ean_comercial, codigo_barras ou gtin
            const ean = produto.ean || produto.ean_comercial || produto.codigo_barras || produto.gtin;
            
            if (ean) {
              this.logger.log(`  📝 Produto ${index + 1}: EAN=${ean}, Nome=${produto.nome || 'Sem nome'}`);
              
              // Dados do produto
              const productUpdate = {
                name: produto.nome || produto.descricao || 'Produto sem nome',
                brand: produto.marca || 'Desconhecida',
                category: produto.categoria || 'Desconhecida',
                ncm: produto.ncm || null,
                updatedAt: new Date(),
              };

              // Upsert do produto
              const result = await this.productModel.updateOne(
                { ean: ean },
                {
                  $set: productUpdate,
                  $setOnInsert: {
                    ean: ean,
                    createdAt: new Date(),
                    hits: 0,
                  }
                },
                { upsert: true }
              );

              if (result.upsertedId || result.modifiedCount > 0) {
                produtosSalvos++;
                const status = result.upsertedId ? 'criado' : 'atualizado';
                this.logger.log(`    ✅ Produto ${status}: ${productUpdate.name}`);
              } else {
                this.logger.log(`    ℹ️  Produto não modificado: ${productUpdate.name}`);
              }

              // Dados do preço
              const priceData = {
                ean: ean,
                productName: produto.nome || produto.descricao || 'Produto sem nome',
                storeCnpj: store.cnpj,
                storeName: store.name,
                price: produto.valor || produto.valor_unitario || 0,
                purchasePrice: produto.valor || produto.valor_unitario || 0,
                source: dados.status === 'sucesso_real' ? 'infosimples-nfe' : 'mock',
                date: new Date(dados.dados.dataEmissao || new Date()),
                nfceKey: chaveAcesso,
                nfeKey: chaveAcesso,
                neighborhood: store.city || 'Desconhecido',
                city: store.city || 'Desconhecida',
                state: store.state || 'BR',
                quantity: produto.quantidade || 1,
                unit: produto.unidade || 'UN',
                confidence: dados.status === 'sucesso_real' ? 9 : 5,
                collector: dados.status === 'sucesso_real' ? 'infosimples-nfe-api' : 'rastru-mock',
                latitude: store.latitude || null,
                longitude: store.longitude || null,
              };

              // Verificar se já existe preço para esta combinação
              const existingPrice = await this.priceModel.findOne({
                ean: ean,
                storeCnpj: store.cnpj,
                nfeKey: chaveAcesso,
              });

              if (!existingPrice) {
                // Criar novo registro de preço
                await this.priceModel.create(priceData);
                precosSalvos++;
                this.logger.log(`    💰 Preço salvo: R$ ${priceData.price.toFixed(2)} para ${priceData.productName}`);
              } else {
                this.logger.log(`    ⚠️  Preço já existe para esta NF-e, ignorando...`);
              }
            } else {
              this.logger.warn(`    ⚠️  Produto ${index + 1} sem EAN, ignorando...`);
              this.logger.debug(`    Produto sem EAN: ${JSON.stringify(produto)}`);
            }
          } catch (prodError: any) {
            this.logger.error(`    ❌ Erro no produto ${index + 1}: ${prodError.message}`);
          }
        }
      } else {
        this.logger.warn('⚠️  Nenhum produto encontrado para salvar');
      }

      this.logger.log(`💾 === RESUMO SALVAMENTO ===`);
      this.logger.log(`   🏪 Lojas: 1`);
      this.logger.log(`   🛒 Produtos: ${produtosSalvos} salvo(s)`);
      this.logger.log(`   💰 Preços: ${precosSalvos} novo(s)`);
      this.logger.log(`   🔧 Fonte: ${dados.status === 'sucesso_real' ? 'NFE Unificada' : 'MOCK'}`);
      this.logger.log(`✅ Salvamento concluído com sucesso!`);

    } catch (error: any) {
      this.logger.error(`❌ ERRO CRÍTICO ao salvar no banco: ${error.message}`);
      this.logger.error(`Stack: ${error.stack?.split('\n').slice(0, 3).join('\n')}`);
    }
  }

  // ============ MÉTODOS AUXILIARES ============

  private extrairCNPJ(chaveAcesso: string): string {
    // CNPJ está nas posições 6-19 (0-indexed)
    const cnpjRaw = chaveAcesso.substring(6, 20);
    return `${cnpjRaw.substring(0, 2)}.${cnpjRaw.substring(2, 5)}.${cnpjRaw.substring(5, 8)}/${cnpjRaw.substring(8, 12)}-${cnpjRaw.substring(12, 14)}`;
  }

  private detectarModelo(chaveAcesso: string): string {
    // Modelo está nas posições 20-22 (0-indexed)
    const modelo = chaveAcesso.substring(20, 22);
    return modelo === '55' ? 'NF-e' : modelo === '65' ? 'NFC-e' : `Modelo ${modelo}`;
  }

  private extrairEstado(codigoUF: string): string {
    const estados: { [key: string]: string } = {
      '11': 'RO', '12': 'AC', '13': 'AM', '14': 'RR', '15': 'PA',
      '16': 'AP', '17': 'TO', '21': 'MA', '22': 'PI', '23': 'CE',
      '24': 'RN', '25': 'PB', '26': 'PE', '27': 'AL', '28': 'SE',
      '29': 'BA', '31': 'MG', '32': 'ES', '33': 'RJ', '35': 'SP',
      '41': 'PR', '42': 'SC', '43': 'RS', '50': 'MS', '51': 'MT',
      '52': 'GO', '53': 'DF'
    };
    return estados[codigoUF] || 'BR';
  }

  // ============ MÉTODOS EXISTENTES (mantidos) ============

  private processarComoMock(chaveAcesso: string) {
    this.logger.log('🎭 Gerando dados MOCK (fallback)...');
    
    const ufCode = chaveAcesso.substring(0, 2);
    const cnpj = this.extrairCNPJ(chaveAcesso);
    const numero = chaveAcesso.substring(25, 34);
    const uf = this.extrairEstado(ufCode);
    const city = uf === 'SP' ? 'São Paulo' : 
                 uf === 'RJ' ? 'Rio de Janeiro' : 
                 uf === 'MG' ? 'Belo Horizonte' : 
                 `${uf} City`;
    
    const produtosMock = [
      { 
        nome: 'ARROZ TIO JOÃO 5KG', 
        ean: '7891234567890',
        quantidade: 1, 
        valor: 25.90,
        unidade: 'UN',
        marca: 'Tio João',
        categoria: 'Alimentos',
      },
      { 
        nome: 'FEIJÃO CARIOCA 1KG', 
        ean: '7891234567891',
        quantidade: 2, 
        valor: 5.50,
        unidade: 'UN',
        marca: 'Camil',
        categoria: 'Alimentos',
      },
    ];
    
    const valorTotal = produtosMock.reduce((sum, p) => sum + (p.valor * p.quantidade), 0);
    
    this.logger.log(`🎭 Mock gerado: ${produtosMock.length} produtos, Total: R$ ${valorTotal.toFixed(2)}`);
    
    return {
      message: 'NF-e MOCK processada (token Infosimples não configurado ou API falhou)',
      status: 'sucesso_mock',
      chaveAcesso,
      dados: {
        uf,
        cnpj,
        numero,
        serie: chaveAcesso.substring(22, 25),
        dataEmissao: new Date().toISOString(),
        valorTotal,
        emitente: `LOJA ${uf}`,
        cidade: city,
        produtos: produtosMock,
        produtosCount: produtosMock.length,
        modelo: this.detectarModelo(chaveAcesso),
      },
      timestamp: new Date().toISOString(),
      observacao: 'Para dados reais, configure INFOSIMPLES_API_TOKEN válido no .env',
    };
  }

  async processarAutomaticamente(qrCode: string, timeout?: number) {
    this.logger.log(`📷 Processando QR Code automaticamente...`);
    
    // Extrair chave do QR Code
    const chaveMatch = qrCode.match(/([0-9]{44})/);
    if (!chaveMatch) {
      throw new BadRequestException('QR Code inválido. Não contém chave de 44 dígitos.');
    }
    
    this.logger.log(`🔑 Chave extraída do QR Code: ${chaveMatch[1].substring(0, 8)}...`);
    
    return this.processarNFCe(chaveMatch[1], timeout);
  }

  async verificarConexaoMongoDB(): Promise<boolean> {
    try {
      await this.storeModel.db.db.command({ ping: 1 });
      this.logger.log('✅ MongoDB conectado');
      return true;
    } catch (error: any) {
      this.logger.error(`❌ MongoDB não conectado: ${error.message}`);
      return false;
    }
  }

  async verificarConexaoInfosimples(): Promise<boolean> {
    if (!this.useRealService) {
      this.logger.log('ℹ️  Infosimples: Modo MOCK (sem token válido configurado)');
      return false;
    }
    
    try {
      this.logger.log('🔍 Testando conexão com NFE Unificada...');
      const testResult = await this.infosimplesService.testConnection();
      
      if (testResult.connected) {
        this.logger.log('✅ NFE Unificada API respondendo');
        return true;
      } else {
        this.logger.warn(`⚠️  NFE Unificada API: ${testResult.message}`);
        return false;
      }
      
    } catch (error: any) {
      this.logger.error(`❌ Erro teste NFE Unificada: ${error.message}`);
      return false;
    }
  }

  async verificarStorage(): Promise<boolean> {
    try {
      await this.storeModel.findOne().limit(1);
      this.logger.log('✅ Storage funcionando');
      return true;
    } catch (error: any) {
      this.logger.error(`❌ Storage error: ${error.message}`);
      return false;
    }
  }

  async testarBanco() {
    try {
      const stores = await this.storeModel.countDocuments();
      const products = await this.productModel.countDocuments();
      const prices = await this.priceModel.countDocuments();
      
      return {
        connected: true,
        counts: {
          stores,
          products,
          prices,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      return {
        connected: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async testarTokenInfosimples() {
    const token = process.env.INFOSIMPLES_API_TOKEN || '';
    
    return {
      tokenPresente: !!token,
      tokenLength: token.length,
      tokenValido: this.useRealService,
      tokenPreview: token ? `${token.substring(0, 10)}...` : 'N/A',
      modoAtual: this.useRealService ? 'REAL (NFE Unificada)' : 'MOCK',
      timestamp: new Date().toISOString(),
    };
  }
}