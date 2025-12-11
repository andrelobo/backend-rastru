# Gemini Development Context for Project Rastru

This document summarizes the development context, decisions made, and current status of the Rastru backend project as of 2025-12-10. It serves as a shared understanding for continuing development.

## 1. Project Overview

The primary goal is to create a backend system that tracks product prices sourced from Brazilian electronic fiscal notes (NFC-e and NF-e). The core user workflow is:

1.  Read a QR Code or receive a 44-digit key for a fiscal note (NFC-e/NF-e).
2.  Ingest this key into the system via a unified API endpoint.
3.  The system uses an external service (Infosimples) to fetch the full details of the fiscal note.
4.  This data is processed and stored using a normalized data model.
5.  Use the collected data to query product prices and other fiscal data.

## 2. Architecture & Technologies

-   **Framework:** NestJS
-   **Language:** TypeScript
-   **Database:** MongoDB
-   **Package Manager:** Yarn

Following a major refactoring, the application now uses a unified and normalized architecture for handling fiscal documents. The previous architectural dichotomy has been resolved.

### 2.1. Unified Ingestion Architecture

This is the primary architecture for the application. It is designed to handle both NF-e (Modelo 55) and NFC-e (Modelo 65) through a single, robust flow.

-   **Core Modules:** `ingestion`, `fiscal-document`, `supplier`, `infosimples`.
-   **Data Model:**
    -   `supplier`: Stores detailed information about the note issuer (the "supplier" or store), including a `2dsphere` geospatial index for location-based queries.
    -   `fiscal-document`: Contains schemas (`nfe.schema.ts`, `nfce.schema.ts`) that store the entire raw fiscal document, linked to a supplier.
-   **Data Flow:** The `ingestion.service` receives a fiscal note key, fetches the data from Infosimples, and passes it to the `fiscal-document.service`. This service then performs an "upsert" on the supplier and saves the complete fiscal document to the appropriate collection (`nfes` or `nfces`).

### 2.2. Deprecated (Legacy) Architecture

The old data model is no longer used by the main ingestion flow but remains in the codebase pending removal.

-   **Modules:** `stores`, `products`, `prices`.
-   **Status:** These modules and their corresponding schemas are now considered obsolete. The new architecture replaces their functionality with a more structured and scalable approach.

## 3. API Endpoints

### Ingestion Module (`/api/ingest`)

All ingestion endpoints now use the new unified `ingestDocument` service, which can process both NF-e and NFC-e.

-   `POST /nfce`: **(Active)** Ingests a fiscal note using its 44-digit key. This endpoint is maintained for backward compatibility.
-   `POST /auto`: **(Active)** Ingests a fiscal note from a full QR code URL.
-   `GET /health`: **(Active)** A health check endpoint for monitoring service status.
-   `GET /debug-raw/:chave`: **(Active)** A debugging endpoint to fetch the raw JSON response from the Infosimples API for a given key.

### Other Modules

Endpoints for `danfe`, `product`, and `price` modules remain, but `product` and `price` endpoints will need to be refactored to use the new data sources (`fiscal-document` collection).

-   `POST /api/v1/danfe/nfce/html/:chave`: **(Stub)**
-   `GET /api/product/:ean`: **(Legacy Data)**
-   `GET /api/price/history/:ean`: **(Legacy Data)**

## 4. Core Workflow: Unified Data Ingestion

The data ingestion workflow is now centralized in the `ingestion` and `fiscal-document` modules.

1.  A request is made to an ingestion endpoint (e.g., `POST /api/ingest/nfce`) with a 44-digit key.
2.  `IngestionController` calls `IngestionService.ingestDocument()`.
3.  `IngestionService` fetches the complete data from the `InfosimplesService`.
4.  The raw data is passed to `FiscalDocumentService.processAndSave()`.
5.  `FiscalDocumentService` performs two main actions:
    -   It **upserts** the supplier's data into the `suppliers` collection, creating or updating the record based on the CNPJ. This includes updating the geospatial `location` field.
    -   It saves the entire fiscal note into the corresponding collection (`nfes` or `nfces`), linking it to the supplier document.

## 5. Development Log & Current Status

-   **Architectural Refactoring:** The primary achievement has been the successful integration of the new architecture. The `ingestion` flow was refactored to use a new `FiscalDocumentService`, unifying the processing of NFe and NFCe and saving them to a normalized data model (`Supplier`, `NFe`, `NFCe`).
-   **Geospatial Feature Parity:** The `supplier.schema.ts` was updated with a `location` field and a `2dsphere` index, ensuring that the new architecture supports the critical geospatial query functionality of the legacy system.
-   **Current Status:** The application is running in development mode (`yarn start:dev`) with the new unified ingestion architecture in place. The system is ready for testing with both NFe and NFCe keys.

## 6. Next Steps

-   **Test Unified Ingestion:** Thoroughly test the `POST /api/ingest/nfce` and `POST /api/ingest/auto` endpoints with a variety of real NFe and NFCe keys to validate the new, unified workflow.
-   **Implement DANFE Service:** Complete the implementation of the `danfe.service.ts` stub. It should now read the data from the `nfes` and `nfces` collections to generate HTML/PDF documents.
-   **Refactor Data-Consuming Endpoints:** Update the services behind the `product` and `price` API endpoints to query the new `fiscal-document` collections instead of the deprecated `products` and `prices` collections. This will likely require creating new services to extract and aggregate product/price data from the stored fiscal documents.
-   **Plan Deprecation:** Once the new architecture is fully tested and all dependent services are updated, create a plan to safely remove the obsolete `stores`, `products`, and `prices` modules from the codebase.