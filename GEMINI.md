# Gemini Development Context for Project Rastru

This document summarizes the development context, decisions made, and current status of the Rastru backend project as of 2025-12-01. It serves as a shared understanding for continuing development.

## 1. Project Overview

The primary goal is to create a backend system that tracks product prices sourced from Brazilian electronic fiscal notes (NFC-e). The core user workflow is:

1.  Read a QR Code from a receipt to get a 44-digit NFC-e key.
2.  Ingest this key into the system.
3.  The system uses an external service (Infosimples) to fetch details of the NFC-e, including products, EANs, and purchase prices.
4.  This data is used to populate a local database.
5.  Use the collected data to query product prices (e.g., by location) and calculate a suggested selling price for a client.

## 2. Architecture & Technologies

-   **Framework:** NestJS
-   **Language:** TypeScript
-   **Database:** MongoDB
-   **Package Manager:** Yarn

The application is structured into the following NestJS modules:
-   `ingestion`: Handles the ingestion of new NFC-e data.
-   `products`: Manages product information.
-   `prices`: Manages price information and history.
-   `stores`: Manages store information.
-   `infosimples`: A service to communicate with the external Infosimples API.

## 3. API Endpoints

The following primary endpoints have been identified from the `README.md`:

-   `POST /api/ingest/nfce`: Ingests a new fiscal note using its 44-digit key.
-   `GET /api/product/:ean`: Retrieves a product by its EAN.
-   `GET /api/product/search?q=...`: Searches for products by a query string.
-   `GET /api/price/history/:ean`: Retrieves the price history for a product.
-   `GET /api/price/lowest/:ean`: Finds the lowest recorded price for a product.
-   `GET /api/price/nearby?ean=&lat=&lng=&radius=`: Finds prices for a product in a given geographical area.

## 4. Core Workflow: Data Ingestion & Population

We have confirmed that the database does **not** need to be pre-populated. The `ingestion.service` implements an **"upsert"** logic:

-   When an NFC-e is processed via `POST /api/ingest/nfce`:
    -   The associated store is created if it doesn't exist (based on CNPJ) or updated if it does.
    -   For each item in the note, the corresponding product is created if it doesn't exist (based on EAN) or left untouched if it does. This uses `$setOnInsert` to avoid overwriting existing product data.
    -   A new `price` document is always created to record the specific purchase price, date, and location.

This allows the database to be built organically from the ingested fiscal notes.

## 5. Development Log & Current Status

-   **Setup:** Project dependencies were installed using `yarn`.
-   **Fixes Implemented:**
    1.  **Missing Dependencies:** Added `reflect-metadata` and `rxjs` to `package.json` as they were required peer dependencies.
    2.  **`main.ts` Fix:** Added `import 'reflect-metadata';` to the first line of `src/main.ts` to resolve a startup error.
    3.  **Schema Errors:** Fixed `Cannot determine a type` errors in `product.schema.ts` and `price.schema.ts` by explicitly defining the type for fields using `Record<string, any>`. The fix was to change `@Prop()` to `@Prop({ type: Object })`.
    4.  **Dependency Injection:** Resolved a `Nest can't resolve dependencies` error in `ProductsService`. The `PriceModel` was made available to `ProductsModule` by importing it via `MongooseModule.forFeature()`.
    5.  **Logging:** Added connection logging for MongoDB in `app.module.ts` to provide feedback on the database connection status.
-   **Recent Actions & Discussions:**
    -   **`.gitignore` Creation:** Created a `.gitignore` file with standard entries for Node.js/NestJS projects.
    -   **`README.md` Improvement:** Improved and translated the `README.md` to Portuguese, providing a more comprehensive project overview and setup instructions.
    -   **Authentication Status:** Confirmed that no authentication mechanism is currently implemented.
    -   **Git Status:** The user has performed a `git push`.
-   **Current Status:** The application is successfully running in development mode (`yarn start:dev`). The user is proceeding to test the `POST /api/ingest/nfce` endpoint using an API client (Insomnia) and a real NFC-e key.

## 6. Next Steps

-   **Aguardando Dados para Teste de Ingestão:** Estamos aguardando os dados de uma nota fiscal (chave NFC-e) do usuário para testar o endpoint de ingestão (`POST /api/ingest/nfce`) e o cadastro de produtos. O trabalho está pausado neste ponto, aguardando essa entrada.
-   **Develop Price Suggestion Feature:** The next major feature to implement is the logic for suggesting a selling price. This will likely involve creating a new endpoint or enhancing an existing one (`/api/price/nearby`) to:
    1.  Query the database for purchase prices of a given EAN.
    2.  Apply a business rule (e.g., add a markup percentage) to calculate a suggested selling price.
    3.  Return this suggestion to the client.
