# Rastru Backend

Backend para rastreamento de preços de compra de produtos via NFC-e para auxiliar na sugestão de preços de venda.

## Sobre o Projeto

Este projeto é o backend de uma aplicação de rastreamento de preços. Sua principal função é receber chaves de acesso de Notas Fiscais de Consumidor Eletrônicas (NFC-e), consultar um serviço externo para obter os detalhes da nota (produtos, preços, lojas), e armazenar essas informações em um banco de dados local.

O objetivo final é construir um histórico de preços de compra que possa ser utilizado para analisar o mercado e sugerir preços de venda competitivos.

## Tecnologias

-   **Node.js**
-   **NestJS**
-   **TypeScript**
-   **MongoDB** (com Mongoose)
-   **Yarn** (Gerenciador de Pacotes)

## Como Executar o Projeto

1.  **Clone o repositório:**
    ```bash
    git clone <URL_DO_SEU_REPOSITORIO>
    cd rastru-backend-full
    ```

2.  **Instale as dependências:**
    ```bash
    yarn install
    ```

3.  **Configure as Variáveis de Ambiente:**
    -   Copie o arquivo de exemplo `.env.example` para um novo arquivo chamado `.env`.
        ```bash
        cp env.example .env
        ```
    -   Edite o arquivo `.env` e preencha as seguintes variáveis:
        -   `MONGO_URI`: A string de conexão para o seu banco de dados MongoDB.
        -   `INFOSIMPLES_API_TOKEN`: O seu token de acesso para a API do [Infosimples](https://infosimples.com/).

4.  **Inicie a Aplicação em Modo de Desenvolvimento:**
    ```bash
    yarn start:dev
    ```
    O servidor estará disponível em `http://localhost:3000` (ou na porta definida em seu arquivo `.env`).

## Endpoints da API

-   `POST /api/ingest/nfce`
    -   **Descrição:** Inicia o processo de ingestão de uma nova NFC-e.
    -   **Body:** `{ "nfce": "<CHAVE_DE_44_DIGITOS>" }`

-   `GET /api/product/:ean`
    -   **Descrição:** Busca um produto pelo seu código EAN.

-   `GET /api/product/search?q=<TERMO_DE_BUSCA>`
    -   **Descrição:** Pesquisa por produtos que contenham o termo de busca no nome.

-   `GET /api/price/history/:ean`
    -   **Descrição:** Retorna o histórico de preços para um produto específico.

-   `GET /api/price/lowest/:ean`
    -   **Descrição:** Retorna o menor preço já registrado para um produto.

-   `GET /api/price/nearby?ean=<EAN>&lat=<LAT>&lng=<LNG>&radius=<RAIO_EM_METROS>`
    -   **Descrição:** Busca por preços de um produto em lojas dentro de um raio geográfico específico.