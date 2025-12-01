import { Injectable } from '@nestjs/common';
import { InfosimplesService } from '../infosimples/infosimples.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Price } from '../prices/schemas/price.schema';
import { Store } from '../stores/schemas/store.schema';
import { Product } from '../products/schemas/product.schema';
@Injectable()
export class IngestionService {
  constructor(
    private infosimples: InfosimplesService,
    @InjectModel(Price.name) private priceModel: Model<Price>,
    @InjectModel(Store.name) private storeModel: Model<Store>,
    @InjectModel(Product.name) private productModel: Model<Product>
  ) {}
  async ingestNfceKey(nfceKey: string) {
    if(!nfceKey || nfceKey.length < 10) return { ok:false, reason:'invalid key' };
    const resp = await this.infosimples.consultNfce(nfceKey);
    if(!resp || resp.code !== 200 || (resp.data_count || 0) === 0) {
      return { ok:false, code: resp?.code, errors: resp?.errors || [] };
    }
    const item = resp.data[0];
    const emitter = item.nfe?.emitente || item.emitente || {};
    const store = {
      cnpj: emitter.normalizado_cnpj || emitter.cnpj || '',
      name: emitter.nome || emitter.nome_fantasia || '',
      address: emitter.endereco || '',
      neighborhood: emitter.bairro || item.local?.bairro || '',
      city: emitter.municipio || '',
      state: emitter.uf || ''
    };
    await this.storeModel.updateOne({ cnpj: store.cnpj }, { $set: store }, { upsert: true });
    const produtos = item.produtos || [];
    const saved = [];
    for(const p of produtos) {
      const ean = p.ean_comercial || p.ean_tributavel || '';
      const productName = p.descricao || '';
      const priceVal = p.normalizado_valor || p.normalizado_valor_unitario || p.normalizado_valor_unitario_comercial || p.normalizado_valor;
      const date = new Date(item.nfe?.data_emissao || Date.now());
      if(ean) {
        await this.productModel.updateOne({ ean }, { $setOnInsert: { ean, name: productName } }, { upsert: true });
      } else {
        await this.productModel.updateOne({ name: productName }, { $setOnInsert: { name: productName } }, { upsert: true });
      }
      const priceDoc = { ean: ean||'', productName, storeCnpj: store.cnpj, storeName: store.name, neighborhood: store.neighborhood, price: Number(priceVal||0), source: 'infosimples', date, nfceKey, raw: p };
      await this.priceModel.create(priceDoc);
      saved.push(priceDoc);
    }
    return { ok:true, savedCount: saved.length };
  }
}
