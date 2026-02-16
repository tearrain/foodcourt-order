# FoodCourt Order System - Architecture

## System Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                         Cloudflare Network                           │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────────────────┐    │
│  │  Pages (H5) │   │ Pages(Admin)│   │  Workers (API)          │    │
│  │  Consumer    │   │ Management  │   │  Hono + TypeScript      │    │
│  │  Vue3+Vite  │   │ Vue3+Vite   │   │  /api/v1/*              │    │
│  └──────┬──────┘   └──────┬──────┘   └──────┬──────────────────┘    │
│         │                 │                  │                        │
│         └─────────────────┴──────────────────┘                       │
│                           │                                          │
│              ┌────────────┼────────────┐                             │
│              │            │            │                              │
│         ┌────┴────┐  ┌───┴───┐  ┌────┴────┐                        │
│         │   D1    │  │  KV   │  │   R2    │                         │
│         │ SQLite  │  │ Cache │  │ Storage │                         │
│         └─────────┘  └───────┘  └─────────┘                        │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

## Project Structure

```
foodcourt-order/
├── src/                    # Backend API (Cloudflare Workers)
│   ├── api/                # Route handlers
│   ├── services/           # Business logic
│   ├── config/             # Configuration
│   ├── types/              # TypeScript types
│   ├── utils/              # Utilities
│   └── index.ts            # Entry point
│
├── frontend/               # H5 Consumer App (Cloudflare Pages)
│   ├── src/
│   │   ├── views/          # Page components
│   │   ├── components/     # Reusable UI components
│   │   ├── stores/         # Pinia state management
│   │   ├── i18n/           # Internationalization
│   │   ├── api/            # API client
│   │   ├── router/         # Vue Router
│   │   └── composables/    # Vue composables
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
│
├── admin/                  # Admin Panel (Cloudflare Pages)
│   ├── src/
│   │   ├── views/          # Admin pages
│   │   ├── components/     # Admin UI components
│   │   ├── stores/         # Admin state
│   │   ├── i18n/           # Admin i18n
│   │   ├── api/            # Admin API client
│   │   └── router/         # Admin router
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
│
├── schema.sql              # Database schema
├── seed.sql                # Seed data
├── wrangler.toml           # Workers config
└── package.json            # Root package
```

## Tech Stack

| Layer        | Technology                         | Hosting           |
|--------------|------------------------------------|--------------------|
| H5 Frontend  | Vue 3 + Vite + TailwindCSS        | Cloudflare Pages   |
| Admin Panel  | Vue 3 + Vite + TailwindCSS        | Cloudflare Pages   |
| API Backend  | Hono + TypeScript                  | Cloudflare Workers |
| Database     | D1 (SQLite)                        | Cloudflare D1      |
| Cache        | Workers KV                         | Cloudflare KV      |
| Storage      | R2 (images)                        | Cloudflare R2      |
| Auth         | JWT                                | Workers            |
| Payment      | Stripe / GrabPay / Mock            | Workers            |

## i18n Strategy

**Supported Languages:** en, zh-CN, zh-TW, ms, id, th, ja, ko

**Detection Priority:**
1. URL parameter `?lang=zh-CN`
2. LocalStorage saved preference
3. `navigator.language` (browser language)
4. Default: `en`

**Implementation:**
- Frontend: `vue-i18n` with lazy-loaded locale files
- Backend: `Accept-Language` header parsing
- Content: `i18n_content` table for dynamic content (dish names, descriptions)
- Static UI text: JSON locale files bundled with frontend

## User Roles & Permissions

| Role               | Scope              | Access                           |
|--------------------|--------------------|----------------------------------|
| Consumer (C-end)   | Public             | Browse, order, pay, review       |
| Stall Admin        | Own stall          | Manage dishes, view orders       |
| Food Court Admin   | Own food court     | Manage stalls, orders, settlement|
| Platform Admin     | Global             | All food courts, global config   |

## Core Business Flows

### 1. Consumer Order Flow
```
Scan QR → View Food Court → Browse Stalls/Dishes → Add to Cart
    → Checkout (single payment) → Order Split to Stalls
    → Each Stall Prepares → Ready Notification → Complete
```

### 2. Settlement Flow
```
Order Paid → Auto-split by Stall → Calculate Commission
    → Generate Settlement Record → Periodic Payout
```

### 3. Admin Flows
```
Platform Admin: Create Food Court → Assign Admin → Monitor
Food Court Admin: Manage Stalls → Track Orders → View Settlement
```

## Deployment

```bash
# API Backend
wrangler deploy

# H5 Frontend
cd frontend && npm run build
# Deploy via Cloudflare Pages (connected to git)

# Admin Panel
cd admin && npm run build
# Deploy via Cloudflare Pages (connected to git)
```
