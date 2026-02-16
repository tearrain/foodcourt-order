# Deployment Guide

## Prerequisites

- Node.js 18+
- Cloudflare account
- Wrangler CLI (`npm install -g wrangler`)

## 1. Setup Cloudflare

```bash
# Login to Cloudflare
wrangler login

# Create D1 database
wrangler d1 create foodcourt_order
# Copy the database_id to wrangler.toml

# Run database migrations
wrangler d1 execute foodcourt_order --remote --file=./schema.sql
wrangler d1 execute foodcourt_order --remote --file=./schema补充.sql
wrangler d1 execute foodcourt_order --remote --file=./seed.sql

# Set secrets
wrangler secret put JWT_SECRET
```

## 2. Deploy API (Cloudflare Workers)

```bash
# Install dependencies
npm install

# Deploy
wrangler deploy
```

## 3. Deploy H5 Frontend (Cloudflare Pages)

```bash
cd frontend
npm install
npm run build

# Deploy via Cloudflare Pages:
# - Connect your git repo in Cloudflare Dashboard
# - Build command: cd frontend && npm run build
# - Build output: frontend/dist
# - Or use wrangler pages deploy:
npx wrangler pages deploy dist --project-name=foodcourt-h5
```

## 4. Deploy Admin Panel (Cloudflare Pages)

```bash
cd admin
npm install
npm run build

npx wrangler pages deploy dist --project-name=foodcourt-admin
```

## Environment Variables

| Variable | Description | Where |
|----------|-------------|-------|
| JWT_SECRET | JWT signing secret | `wrangler secret put` |
| STRIPE_SECRET_KEY | Stripe API key | `wrangler secret put` |
| STRIPE_WEBHOOK_SECRET | Stripe webhook secret | `wrangler secret put` |

## Custom Domains

Configure custom domains in Cloudflare Dashboard:
- API: `api.yourdomain.com` -> Workers
- H5: `order.yourdomain.com` -> Pages (frontend)
- Admin: `admin.yourdomain.com` -> Pages (admin)
