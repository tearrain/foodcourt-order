#!/bin/bash
# =============================================================
# Food Court Ordering System - One-click Deploy Script
# Deploys to Cloudflare: Workers (API) + Pages (H5 + Admin)
# =============================================================

set -e

echo "🍜 Food Court Ordering System - Deploy to Cloudflare"
echo "======================================================"
echo ""

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required. Install from https://nodejs.org"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm is required."; exit 1; }
command -v npx >/dev/null 2>&1 || { echo "❌ npx is required."; exit 1; }

# Check if wrangler is available globally or locally
if ! command -v wrangler >/dev/null 2>&1 && ! npx wrangler --version >/dev/null 2>&1; then
  echo "📦 Installing wrangler..."
  npm install -g wrangler
fi

WRANGLER="npx wrangler"

echo ""
echo "Step 1: Checking Cloudflare authentication..."
echo "----------------------------------------------"
$WRANGLER whoami || {
  echo ""
  echo "⚠️  Not logged in to Cloudflare."
  echo "   Please run: npx wrangler login"
  echo "   Then re-run this script."
  exit 1
}

echo ""
echo "Step 2: Creating D1 Database..."
echo "----------------------------------------------"
# Create D1 database (will skip if already exists)
DB_OUTPUT=$($WRANGLER d1 create foodcourt_order 2>&1 || true)
echo "$DB_OUTPUT"

# Extract database ID
DB_ID=$(echo "$DB_OUTPUT" | grep -oP 'database_id\s*=\s*"\K[^"]+' || true)

if [ -z "$DB_ID" ]; then
  # If database already exists, try to get ID from list
  DB_ID=$($WRANGLER d1 list --json 2>/dev/null | node -e "
    const data = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
    const db = data.find(d => d.name === 'foodcourt_order');
    if (db) console.log(db.uuid);
  " 2>/dev/null || true)
fi

if [ -z "$DB_ID" ]; then
  echo "❌ Could not determine D1 database ID."
  echo "   Please create manually: npx wrangler d1 create foodcourt_order"
  echo "   Then update wrangler.toml with the database_id"
  exit 1
fi

echo "✅ D1 Database ID: $DB_ID"

# Update wrangler.toml with the real database ID
sed -i "s/database_id = \"YOUR_D1_DATABASE_ID\"/database_id = \"$DB_ID\"/" wrangler.toml
echo "✅ Updated wrangler.toml with database ID"

echo ""
echo "Step 3: Initializing Database Schema..."
echo "----------------------------------------------"
$WRANGLER d1 execute foodcourt_order --remote --file=./schema.sql
echo "✅ Main schema applied"

if [ -f "./schema补充.sql" ]; then
  $WRANGLER d1 execute foodcourt_order --remote --file=./schema补充.sql
  echo "✅ Supplementary schema applied"
fi

echo ""
echo "Step 4: Seeding Database..."
echo "----------------------------------------------"
read -p "Do you want to seed the database with sample data? (y/N): " SEED_CONFIRM
if [ "$SEED_CONFIRM" = "y" ] || [ "$SEED_CONFIRM" = "Y" ]; then
  $WRANGLER d1 execute foodcourt_order --remote --file=./seed.sql
  echo "✅ Seed data applied"
else
  echo "⏭️  Skipped seeding"
fi

echo ""
echo "Step 5: Setting Secrets..."
echo "----------------------------------------------"
echo "Setting JWT_SECRET..."
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
echo "$JWT_SECRET" | $WRANGLER secret put JWT_SECRET

echo ""
echo "⚠️  Optional: Set payment provider secrets if needed:"
echo "   npx wrangler secret put STRIPE_SECRET_KEY"
echo "   npx wrangler secret put STRIPE_WEBHOOK_SECRET"

echo ""
echo "Step 6: Deploying Workers API..."
echo "----------------------------------------------"
$WRANGLER deploy
echo "✅ Workers API deployed!"
API_URL=$($WRANGLER deployments list --json 2>/dev/null | node -e "
  try {
    const d = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
    console.log('https://foodcourt-order-api.' + (d[0]?.triggers?.[0]?.split('.')?.[1] || 'workers') + '.dev');
  } catch(e) { console.log('https://foodcourt-order-api.<your-subdomain>.workers.dev'); }
" 2>/dev/null || echo "https://foodcourt-order-api.<your-subdomain>.workers.dev")
echo "   API URL: $API_URL"

echo ""
echo "Step 7: Building & Deploying H5 Frontend..."
echo "----------------------------------------------"
cd frontend
npm install
npm run build
$WRANGLER pages deploy dist --project-name=foodcourt-h5 --branch=production
echo "✅ H5 Frontend deployed!"
cd ..

echo ""
echo "Step 8: Building & Deploying Admin Panel..."
echo "----------------------------------------------"
cd admin
npm install
npm run build
$WRANGLER pages deploy dist --project-name=foodcourt-admin --branch=production
echo "✅ Admin Panel deployed!"
cd ..

echo ""
echo "======================================================"
echo "🎉 Deployment Complete!"
echo "======================================================"
echo ""
echo "📱 H5 Consumer App:  https://foodcourt-h5.pages.dev"
echo "🔧 Admin Panel:      https://foodcourt-admin.pages.dev"
echo "🔌 API Backend:      $API_URL"
echo ""
echo "Next Steps:"
echo "  1. Update frontend API base URL to point to your Workers API"
echo "  2. Set up custom domains in Cloudflare Dashboard if needed"
echo "  3. Configure payment provider secrets for production"
echo ""
echo "For custom domains:"
echo "  npx wrangler pages project list"
echo "  Then go to Cloudflare Dashboard > Pages > Custom Domains"
echo ""
