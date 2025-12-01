Rastru backend (skeleton)
Setup:
1. cp .env.example .env
2. fill INFOSIMPLES_API_TOKEN and MONGO_URI if needed
3. npm install
4. npm run start:dev
Endpoints:
POST /api/ingest/nfce { nfce: "<44-digit-key>" }
GET  /api/product/:ean
GET  /api/product/search?q=...
GET  /api/price/history/:ean
GET  /api/price/lowest/:ean
GET  /api/price/nearby?ean=&lat=&lng=&radius=
