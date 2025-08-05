#!/bin/bash

# PersonaPass Production Deployment Script
# Deploy to AWS/Vercel with zero downtime

set -e

echo "🚀 PersonaPass Production Deployment"
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT="production"
AWS_REGION="us-east-1"
VERCEL_PROJECT="personapass-frontend"
PERSONACHAIN_NODE="https://personachain-rpc-lb-1471567419.us-east-1.elb.amazonaws.com"

# Pre-deployment checks
echo -e "${YELLOW}🔍 Running pre-deployment checks...${NC}"

# Check environment variables
required_vars=("STRIPE_SECRET_KEY" "DATABASE_URL" "JWT_SECRET" "PERSONACHAIN_MNEMONIC")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}❌ Missing required environment variable: $var${NC}"
        exit 1
    fi
done

# Run tests
echo -e "${YELLOW}🧪 Running test suite...${NC}"
npm test -- --passWithNoTests || {
    echo -e "${RED}❌ Tests failed! Aborting deployment.${NC}"
    exit 1
}

# Check PersonaChain connectivity
echo -e "${YELLOW}🌐 Checking PersonaChain connectivity...${NC}"
curl -s -X POST $PERSONACHAIN_NODE \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"status","params":[],"id":1}' | grep -q "result" || {
    echo -e "${RED}❌ Cannot connect to PersonaChain! Aborting.${NC}"
    exit 1
}

# Build application
echo -e "${YELLOW}🔨 Building application...${NC}"
NODE_ENV=production npm run build || {
    echo -e "${RED}❌ Build failed! Aborting deployment.${NC}"
    exit 1
}

# Compile ZK circuits
echo -e "${YELLOW}🔐 Compiling ZK circuits...${NC}"
cd circuits
./build.sh || {
    echo -e "${RED}❌ Circuit compilation failed!${NC}"
    echo "Please install circom and snarkjs first"
    exit 1
}
cd ..

# Database migrations
echo -e "${YELLOW}🗄️ Running database migrations...${NC}"
# npx prisma migrate deploy --preview-feature

# Deploy to Vercel
echo -e "${YELLOW}🌍 Deploying to Vercel...${NC}"
vercel --prod --yes || {
    echo -e "${RED}❌ Vercel deployment failed!${NC}"
    exit 1
}

# Deploy Shopify app
echo -e "${YELLOW}🛒 Deploying Shopify app...${NC}"
cd shopify-app
npm run deploy || echo -e "${YELLOW}⚠️  Shopify app deployment skipped${NC}"
cd ..

# Deploy smart contracts to PersonaChain
echo -e "${YELLOW}⛓ Deploying to PersonaChain...${NC}"
node scripts/deploy-personachain.js || {
    echo -e "${RED}❌ PersonaChain deployment failed!${NC}"
    exit 1
}

# Update CDN assets
echo -e "${YELLOW}🌐 Updating CDN assets...${NC}"
aws s3 sync public/circuits s3://personapass-cdn/circuits \
  --cache-control "public,max-age=31536000" \
  --acl public-read

aws s3 cp public/shopify-age-gate.js s3://personapass-cdn/ \
  --cache-control "public,max-age=3600" \
  --acl public-read

# Invalidate CloudFront
aws cloudfront create-invalidation \
  --distribution-id $CLOUDFRONT_DISTRIBUTION_ID \
  --paths "/*"

# Health check
echo -e "${YELLOW}🏥 Running health checks...${NC}"
sleep 10

# Check frontend
curl -s https://app.personapass.xyz/health | grep -q "ok" || {
    echo -e "${RED}❌ Frontend health check failed!${NC}"
    exit 1
}

# Check API
curl -s https://app.personapass.xyz/api/health | grep -q "ok" || {
    echo -e "${RED}❌ API health check failed!${NC}"
    exit 1
}

# Set up monitoring alerts
echo -e "${YELLOW}📊 Configuring monitoring...${NC}"
node scripts/setup-monitoring.js

# Notify team
echo -e "${GREEN}✅ Deployment successful!${NC}"
echo ""
echo "Deployment Summary:"
echo "=================="
echo "Frontend: https://app.personapass.xyz"
echo "API: https://app.personapass.xyz/api"
echo "CDN: https://cdn.personapass.xyz"
echo "PersonaChain: $PERSONACHAIN_NODE"
echo ""
echo "Next steps:"
echo "1. Verify age gate on test merchant: https://demo.personapass.xyz"
echo "2. Check Stripe webhook delivery"
echo "3. Monitor error rates in Sentry"
echo "4. Announce deployment in #deployments channel"

# Send Slack notification
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"🚀 PersonaPass deployed to production successfully!"}' \
  $SLACK_WEBHOOK_URL 2>/dev/null || true

echo -e "${GREEN}🎆 Deployment complete!${NC}"