import axios from 'axios';
export class InfosimplesService {
  base: string;
  token: string;
  constructor(base: string, token: string) {
    this.base = base;
    this.token = token;
  }
  async consultNfce(nfceKey: string, timeout = 120) {
    const url = `${this.base}/sefaz/am/nfce-completa`;
    const body = { token: this.token, nfce: nfceKey, timeout };
    const res = await axios.post(url, body, { timeout: (timeout + 5) * 1000 });
    return res.data;
  }
}
