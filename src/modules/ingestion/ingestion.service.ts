// src/modules/ingestion/ingestion.service.ts
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
    this.logger.log(`🔧 Modo: ${this.useRealService ? 'REAL' : 'MOCK'}`);
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

    this.logger.log(`🔧 Usando modo: ${this.useRealService ? 'REAL' : 'MOCK'}`);
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
        // REMOVIDO: fallback para mock
        this.logger.error(`🔄 NÃO HAVERÁ FALLBACK PARA MOCK. Erro persistente na API.`);
        throw new BadRequestException(`Falha na consulta à API Infosimples: ${error.message}`);
      }
    } else {
      this.logger.warn('⚠️ Usando MOCK - Configure token Infosimples válido para serviço real');
      const mockResult = this.processarComoMock(chaveAcesso);
      await this.salvarNoBanco(chaveAcesso, mockResult);
      return mockResult;
    }
  }

  /**
   * Método unificado para ingestão (chamado pelo controller)
   */
  async ingestDocument(chaveAcesso: string, timeout?: number) {
    return this.processarNFCe(chaveAcesso, timeout);
  }

  /**
   * Processa QR Code automaticamente
   */
  async processarAutomaticamente(qrCode: string, timeout?: number) {
    this.logger.log(`🔍 Processando QR Code automaticamente...`);
    
    // Extrair chave do QR Code
    const chaveAcesso = this.extrairChaveDoQRCode(qrCode);
    
    if (!chaveAcesso) {
      throw new BadRequestException('Não foi possível extrair chave de acesso do QR Code');
    }
    
    return this.processarNFCe(chaveAcesso, timeout);
  }

  private extrairChaveDoQRCode(qrCode: string): string | null {
    try {
      // Extrai chave de URL como: https://...?p=CHAVE_44_DIGITOS...
      const url = new URL(qrCode);
      const params = new URLSearchParams(url.search);
      const pParam = params.get('p');
      
      if (pParam && pParam.length >= 44) {
        // Pode ter outros parâmetros após a chave separados por |
        const chave = pParam.split('|')[0];
        if (chave.length === 44 && /^\d+$/.test(chave)) {
          return chave;
        }
      }
      
      // Se não encontrou na URL, tenta extrair diretamente
      const match = qrCode.match(/(\d{44})/);
      return match ? match[1] : null;
    } catch {
      // Se não for URL válida, tenta extrair 44 dígitos
      const match = qrCode.match(/(\d{44})/);
      return match ? match[1] : null;
    }
  }

  /**
   * Processa com API NFE Unificada REAL
   */
  private async processarComInfosimplesReal(chaveAcesso: string, timeout?: number) {
    this.logger.log('🔍 Consultando API NFE Unificada...');
    
    const dados = await this.infosimplesService.consultNfe(chaveAcesso, timeout);
    
    // LOG CRÍTICO: Mostra a estrutura COMPLETA da resposta
    this.logger.debug(`✅ Resposta completa da API: ${JSON.stringify(dados, null, 2)}`);
    
    if (!dados) {
      this.logger.error(`❌ API retornou resposta NULL ou undefined`);
      throw new Error('API não retornou nenhuma resposta');
    }
    
    // Log detalhado da estrutura, mesmo se vier vazia
    this.logger.log(`📊 Código da resposta: ${dados.code || 'N/A'}`);
    this.logger.log(`📊 Mensagem: ${dados.code_message || 'N/A'}`);
    this.logger.log(`📊 Quantidade de itens (data_count): ${dados.data_count || 0}`);
    this.logger.log(`📊 Tem erros? ${dados.errors ? JSON.stringify(dados.errors) : 'Não'}`);
    
    if (!dados.data || dados.data.length === 0) {
      this.logger.error(`⚠️ Estrutura da resposta vazia ou sem 'data':`, dados);
      throw new Error(`API respondeu sem dados da NF-e. Estrutura recebida: ${JSON.stringify(dados)}`);
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
        ean: prod.ean_comercial || prod.codigo_barras || prod.gtin || null,
        quantidade: quantidade,
        valor: valorUnitario,
        valor_total: valorTotal,
        unidade: prod.unidade_comercial || 'UN',
        marca: prod.marca || 'Desconhecida',
        categoria: prod.categoria || 'Desconhecida',
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
        modelo: this.detectarModelo(chaveAcesso),
        
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

  // ============ MÉTODOS PARA HEALTH CHECK ============

  async testarBanco() {
    try {
      const count = await this.storeModel.countDocuments();
      return {
        success: true,
        message: `Conexão com MongoDB OK. Lojas no banco: ${count}`,
        storeCount: count,
        productCount: await this.productModel.countDocuments(),
        priceCount: await this.priceModel.countDocuments(),
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async verificarConexaoMongoDB() {
    try {
      await this.storeModel.findOne();
      return { status: 'connected', timestamp: new Date().toISOString() };
    } catch (error: any) {
      return { status: 'disconnected', error: error.message };
    }
  }

  async verificarConexaoInfosimples() {
    try {
      // Testa com uma chave curta
      await this.infosimplesService.testConnection();
      return { status: 'connected', timestamp: new Date().toISOString() };
    } catch (error: any) {
      return { status: 'disconnected', error: error.message };
    }
  }

  async verificarStorage() {
    try {
      const storeCount = await this.storeModel.countDocuments();
      const productCount = await this.productModel.countDocuments();
      const priceCount = await this.priceModel.countDocuments();
      
      return {
        status: 'ok',
        storeCount,
        productCount,
        priceCount,
        storageDate: new Date().toISOString(),
      };
    } catch (error: any) {
      return {
        status: 'error',
        error: error.message,
      };
    }
  }
}