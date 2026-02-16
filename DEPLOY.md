# 部署指南 / Deployment Guide

## 两种部署方式

### 方式一：一键脚本部署（推荐）

```bash
# 1. 先登录 Cloudflare
npx wrangler login

# 2. 运行一键部署脚本
./deploy.sh
```

脚本会自动完成：创建 D1 数据库 → 初始化表结构 → 设置密钥 → 部署 Workers API → 构建并部署 H5 前端 → 构建并部署 Admin 后台

---

### 方式二：通过 GitHub 部署（Cloudflare Pages）

> 你问的 "在 cloudflare 上直接从 github 也可以部署" —— **是的，完全可以！**

#### Step 1: 部署 Workers API（后端）

后端必须用 Wrangler CLI 部署，不支持 Pages 自动部署：

```bash
# 登录
npx wrangler login

# 创建数据库
npx wrangler d1 create foodcourt_order
# 把输出的 database_id 填入 wrangler.toml

# 初始化数据库
npx wrangler d1 execute foodcourt_order --remote --file=./schema.sql
npx wrangler d1 execute foodcourt_order --remote --file=./schema补充.sql
npx wrangler d1 execute foodcourt_order --remote --file=./seed.sql

# 设置 JWT 密钥
npx wrangler secret put JWT_SECRET

# 部署 API
npx wrangler deploy
```

#### Step 2: 通过 GitHub 部署 H5 前端

1. 打开 [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages** → **Create**
2. 选择 **Pages** → **Connect to Git**
3. 选择你的 GitHub 仓库 `tearrain/foodcourt-order`
4. 配置构建设置：
   - **Project name**: `foodcourt-h5`
   - **Build command**: `cd frontend && npm install && npm run build`
   - **Build output directory**: `frontend/dist`
   - **Root directory**: `/`（留空即可）
5. 添加环境变量：
   - `VITE_API_BASE_URL` = `https://foodcourt-order-api.<your-subdomain>.workers.dev`
6. 点击 **Save and Deploy**

#### Step 3: 通过 GitHub 部署 Admin 后台

重复 Step 2 的步骤，但用以下配置：
1. **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
2. 选择同一个仓库
3. 配置：
   - **Project name**: `foodcourt-admin`
   - **Build command**: `cd admin && npm install && npm run build`
   - **Build output directory**: `admin/dist`
4. 添加环境变量：
   - `VITE_API_BASE_URL` = `https://foodcourt-order-api.<your-subdomain>.workers.dev`
5. 点击 **Save and Deploy**

> 之后每次 push 代码到 GitHub，Cloudflare Pages 会自动重新构建和部署！

---

## 手动逐步部署

### 1. 前置准备

- Node.js 18+
- Cloudflare 账户
- Wrangler CLI (`npm install -g wrangler`)

### 2. 部署 API (Cloudflare Workers)

```bash
npx wrangler login
npx wrangler d1 create foodcourt_order
# 更新 wrangler.toml 中的 database_id

npx wrangler d1 execute foodcourt_order --remote --file=./schema.sql
npx wrangler d1 execute foodcourt_order --remote --file=./schema补充.sql
npx wrangler d1 execute foodcourt_order --remote --file=./seed.sql

npx wrangler secret put JWT_SECRET
npx wrangler deploy
```

### 3. 部署 H5 前端 (Cloudflare Pages)

```bash
cd frontend
npm install
npm run build
npx wrangler pages deploy dist --project-name=foodcourt-h5
```

### 4. 部署 Admin 后台 (Cloudflare Pages)

```bash
cd admin
npm install
npm run build
npx wrangler pages deploy dist --project-name=foodcourt-admin
```

## 环境变量

| 变量 | 说明 | 设置方式 |
|------|------|----------|
| JWT_SECRET | JWT 签名密钥 | `wrangler secret put` |
| STRIPE_SECRET_KEY | Stripe API 密钥 | `wrangler secret put` |
| STRIPE_WEBHOOK_SECRET | Stripe Webhook 密钥 | `wrangler secret put` |
| VITE_API_BASE_URL | API 地址（前端用） | Pages 环境变量 |

## 自定义域名

在 Cloudflare Dashboard 配置：
- API: `api.yourdomain.com` → Workers
- H5: `order.yourdomain.com` → Pages (frontend)
- Admin: `admin.yourdomain.com` → Pages (admin)
