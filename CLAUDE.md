# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Food court QR-code ordering system deployed on Cloudflare (Workers + Pages + D1 + KV). Three apps share the repo: a **Hono API backend**, a **Vue 3 consumer frontend**, and a **Vue 3 admin panel**.

## Commands

### Backend (root)
```bash
npm run dev              # Wrangler dev server at :8787
npm run build            # Dry-run build via wrangler
npm test                 # Vitest
npm test -- --run path   # Run a single test file
npm run lint             # ESLint (src/**/*.ts)
npm run format           # Prettier (src/**/*.ts)
npm run db:migrate       # Execute schema.sql on remote D1
npm run db:seed          # Execute seed.sql on remote D1
npm run deploy           # Deploy worker to Cloudflare
```

### Frontend (`frontend/`)
```bash
cd frontend && npm run dev       # Vite dev at :3000, proxies /api → :8787
cd frontend && npm run build     # Production build
cd frontend && npx vue-tsc       # Type-check
```

### Admin (`admin/`)
```bash
cd admin && npm run dev          # Vite dev at :3001
cd admin && npm run build        # Production build
cd admin && npx vue-tsc          # Type-check
```

### Full deploy (DB + secrets + all three apps)
```bash
./deploy.sh
```

## Architecture

```
frontend/ (Vue 3 + Vite + Pinia + vue-i18n)  →  Consumer H5 app
admin/    (Vue 3 + Vite + Pinia + vue-i18n)  →  Admin dashboard
src/      (Hono on Cloudflare Workers)        →  REST API at /api/v1/*
```

### Backend structure (`src/`)
- **Entry:** `index.ts` — Hono app with CORS, logger, language detection, JWT auth middleware
- **`api/`** — Route handlers (one file per resource: food-courts, stalls, dishes, cart, orders, payment, users, reviews, promotions, i18n, search, webhooks)
- **`services/`** — Business logic (auth.ts for JWT, payment.ts for multi-provider payments, translation.ts for AI translation, cache.ts)
- **`types/index.ts`** — All TypeScript types. Hono app uses `AppType` with `Bindings: Env` and `Variables` for request-scoped context
- **`utils/`** — DB helpers (db.ts), standard JSON response formatter (response.ts)
- **`config/`** — App configuration

### Cloudflare bindings (wrangler.toml)
- `DB` — D1 SQLite database
- `CACHE` — KV namespace
- Secrets: `JWT_SECRET`, `STRIPE_SECRET_KEY`, `GRABPAY_*`, `OPENAI_API_KEY`

### Frontend structure (`frontend/src/`)
- Routes are scoped under `/fc/:foodCourtId/` (stalls, dishes, cart, checkout, orders, search)
- `stores/` — Pinia stores (app state, cart)
- `api/` — Axios client with token injection, language header, session ID
- `i18n/` — 8 supported languages (en, zh-CN, zh-TW, ms, id, th, ja, ko)

### Key patterns
- **Auth:** JWT tokens (7d access, 30d refresh). Public endpoints are listed in `src/index.ts` `publicPaths`. Protected endpoints check `c.get('userId')` / `c.get('userRole')` per handler.
- **Guest sessions:** `X-Session-ID` header for unauthenticated cart/orders
- **i18n:** `Accept-Language` header → `c.get('lang')` on backend; vue-i18n on frontend
- **Payments:** Multi-provider (Stripe, GrabPay, WeChat, Alipay, Mock) via `src/services/payment.ts`
- **API responses:** Use `src/utils/response.ts` helpers for consistent `{ code, message, data }` format
- **Database:** Raw D1 SQL queries via helpers in `src/utils/db.ts`. Schema in `schema.sql` + `schema补充.sql`

## CI/CD

GitHub Actions workflows in `.github/workflows/`:
- `ci.yml` — On PR: type-check + build for backend, frontend, admin
- `deploy.yml` — On merge to main: deploy all three apps
- `db-seed.yml` — Manual: seed/migrate database
