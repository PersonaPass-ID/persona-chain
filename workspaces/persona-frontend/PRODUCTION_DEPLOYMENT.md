# 🚀 PersonaPass Production Deployment Guide

## 📋 Environment Variables for Vercel/Cloudflare

### Core Variables (REQUIRED)

```bash
# === APPLICATION ===
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://personapass.io
NEXT_PUBLIC_API_URL=https://api.personapass.io

# === SECURITY (Generate fresh keys!) ===
JWT_SECRET=<generate-with: openssl rand -base64 64>
SESSION_SECRET=<generate-with: openssl rand -base64 64>
NEXTAUTH_SECRET=<generate-with: openssl rand -base64 64>

# === BLOCKCHAIN (Using Polygon for production) ===
# Since PersonaChain is down, we'll use Polygon mainnet
NEXT_PUBLIC_BLOCKCHAIN_NETWORK=polygon
NEXT_PUBLIC_POLYGON_RPC_URL=https://polygon-rpc.com
NEXT_PUBLIC_CHAIN_ID=137
NEXT_PUBLIC_CONTRACT_ADDRESS=<deploy-and-get-address>

# Alternative: Arbitrum One
# NEXT_PUBLIC_BLOCKCHAIN_NETWORK=arbitrum
# NEXT_PUBLIC_ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
# NEXT_PUBLIC_CHAIN_ID=42161

# === DATABASE (AWS DynamoDB) ===
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<your-aws-access-key>
AWS_SECRET_ACCESS_KEY=<your-aws-secret-key>
DYNAMODB_TABLE_NAME=PersonaPassCredentials-prod

# === PAYMENTS (Stripe) ===
STRIPE_SECRET_KEY=sk_live_<your-live-secret-key>
STRIPE_WEBHOOK_SECRET=whsec_<your-webhook-secret>
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_<your-live-publishable-key>

# === WALLET INTEGRATION ===
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=<your-project-id>
```

### Optional but Recommended

```bash
# === MONITORING ===
SENTRY_DSN=https://your-sentry-dsn@sentry.io/your-project-id
LOG_LEVEL=warn

# === CACHING (Redis) ===
REDIS_URL=redis://your-redis-host:6379

# === FILE UPLOADS (S3) ===
UPLOAD_BUCKET_NAME=personapass-uploads-prod
S3_ACCESS_KEY_ID=<your-s3-access-key>
S3_SECRET_ACCESS_KEY=<your-s3-secret-key>

# === RATE LIMITING ===
API_RATE_LIMIT_WINDOW_MS=900000
API_RATE_LIMIT_MAX_REQUESTS=100

# === FEATURE FLAGS ===
ENABLE_ANALYTICS=true
ENABLE_DEBUG_LOGGING=false
MAINTENANCE_MODE=false
```

## 🔧 Deployment Steps

### 1. Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Set environment variables via CLI
vercel env add JWT_SECRET production
vercel env add SESSION_SECRET production
# ... repeat for all variables
```

### 2. Cloudflare Pages Deployment

```bash
# Install Wrangler CLI
npm i -g wrangler

# Login to Cloudflare
wrangler login

# Create pages project
wrangler pages project create personapass

# Deploy
wrangler pages deploy out --project-name=personapass

# Set environment variables in Cloudflare Dashboard
# Settings > Environment Variables > Production
```

### 3. AWS Lambda Deployment (for serverless API)

```bash
# Deploy serverless functions
cd aws
npm install
serverless deploy --stage prod
```

## 🔐 Smart Contract Deployment

Since PersonaChain is down, deploy to Polygon:

```bash
# Deploy contracts
cd contracts
npx hardhat run scripts/deploy-multichain.js --network polygon

# Verify contracts
npx hardhat verify --network polygon <CONTRACT_ADDRESS>
```

## 🌐 DNS Configuration

### Vercel
1. Add custom domain in Vercel dashboard
2. Update DNS records:
   - A record: 76.76.21.21
   - CNAME: cname.vercel-dns.com

### Cloudflare
1. Add custom domain in Cloudflare Pages
2. DNS automatically configured if using Cloudflare DNS

## 📊 Monitoring Setup

### 1. Enable Monitoring
```javascript
// sentry.client.config.js
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: 'production',
  tracesSampleRate: 0.1,
});
```

### 2. Setup Health Checks
- Vercel: Built-in monitoring
- Cloudflare: Workers Analytics
- Custom: `/api/health` endpoint

## 🚨 Critical Pre-Launch Checklist

- [ ] Generate new JWT_SECRET (64+ chars)
- [ ] Generate new SESSION_SECRET (64+ chars)
- [ ] Use production Stripe keys
- [ ] Deploy smart contracts to mainnet
- [ ] Configure production database
- [ ] Setup Redis for caching
- [ ] Enable HTTPS everywhere
- [ ] Configure CORS properly
- [ ] Setup rate limiting
- [ ] Enable security headers
- [ ] Configure backup RPC nodes
- [ ] Test wallet connections
- [ ] Verify email/SMS services
- [ ] Setup error monitoring
- [ ] Configure analytics
- [ ] Load test the application
- [ ] Security audit smart contracts
- [ ] Setup incident response plan

## 🔄 Fallback RPC Configuration

Since PersonaChain is down, use these fallback RPCs:

```javascript
const RPC_ENDPOINTS = {
  polygon: [
    'https://polygon-rpc.com',
    'https://rpc-mainnet.matic.network',
    'https://matic-mainnet.chainstacklabs.com',
    'https://polygon-mainnet.g.alchemy.com/v2/<API_KEY>'
  ],
  arbitrum: [
    'https://arb1.arbitrum.io/rpc',
    'https://arbitrum-mainnet.infura.io/v3/<API_KEY>',
    'https://arbitrum.blockpi.network/v1/rpc/public'
  ],
  optimism: [
    'https://mainnet.optimism.io',
    'https://optimism-mainnet.infura.io/v3/<API_KEY>'
  ]
};
```

## 💰 Cost Optimization

### Free/Low-Cost Services
- Vercel: Free tier for small projects
- Cloudflare Pages: Unlimited requests
- Polygon: ~$0.001 per transaction
- DynamoDB: Pay-per-request pricing
- Redis: Free tier available (RedisLabs)

### Estimated Monthly Costs
- Hosting: $0-20 (Vercel/Cloudflare)
- Database: $5-25 (DynamoDB)
- Blockchain: $10-50 (gas fees)
- Redis: $0-15 (caching)
- Total: ~$15-110/month

## 🆘 Troubleshooting

### PersonaChain Connection Issues
```javascript
// Use fallback to Polygon
if (!personaChainResponding) {
  switchToNetwork('polygon');
}
```

### Environment Variable Issues
- Vercel: Check dashboard > Settings > Environment Variables
- Cloudflare: Check Pages > Settings > Environment Variables
- Ensure no quotes around values
- Restart deployment after changes

### Database Connection Issues
- Verify AWS credentials
- Check DynamoDB table exists
- Verify IAM permissions

## 📞 Support Contacts

- Technical Issues: dev@personapass.io
- Security Issues: security@personapass.io
- Business: hello@personapass.io