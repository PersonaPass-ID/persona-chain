# PersonaPass Age Verification - Production Deployment Guide

## 🚀 Quick Start

This guide walks you through deploying PersonaPass Age Verification to production.

**Time Required**: ~2 hours
**Prerequisites**: Node.js 18+, Git, Vercel/AWS account, Stripe account

---

## 📋 Pre-Deployment Checklist

### Required Accounts
- [ ] **Stripe Account** (production mode)
- [ ] **Vercel Account** (or AWS)
- [ ] **PersonaChain Mainnet Access**
- [ ] **Shopify Partner Account** (for app submission)
- [ ] **Domain Name** (personapass.xyz or similar)
- [ ] **SSL Certificate** (auto-handled by Vercel)

### Required API Keys
- [ ] Stripe Secret Key (production)
- [ ] Stripe Publishable Key (production)
- [ ] Stripe Webhook Secret
- [ ] PersonaChain RPC Endpoint
- [ ] Mixpanel Token (analytics)
- [ ] Google Analytics ID
- [ ] Sentry DSN (error tracking)

---

## 🔧 Environment Configuration

### 1. Create Production Environment File

```bash
cp .env.example .env.production
```

### 2. Update Environment Variables

```env
# App Configuration
NEXT_PUBLIC_APP_URL=https://personapass.xyz
NODE_ENV=production

# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_AGE_VERIFICATION_PRICE_ID=price_xxx

# PersonaChain Configuration
NEXT_PUBLIC_PERSONACHAIN_RPC=https://rpc.personachain.xyz
NEXT_PUBLIC_PERSONACHAIN_CHAIN_ID=persona-1
PERSONACHAIN_PRIVATE_KEY=xxx

# Database
DATABASE_URL=postgresql://user:pass@host:5432/personapass

# Analytics
NEXT_PUBLIC_MIXPANEL_TOKEN=xxx
NEXT_PUBLIC_GA_ID=G-xxx

# Error Tracking
SENTRY_DSN=https://xxx@sentry.io/xxx
SENTRY_AUTH_TOKEN=xxx

# Security
JWT_SECRET=xxx
ENCRYPTION_KEY=xxx
```

---

## 🏗️ Build & Deploy Process

### Option 1: Vercel Deployment (Recommended)

#### 1. Install Vercel CLI
```bash
npm i -g vercel
```

#### 2. Build ZK Circuits
```bash
cd circuits
./build.sh
cd ..
```

#### 3. Deploy to Vercel
```bash
vercel --prod
```

#### 4. Configure Domain
```bash
vercel domains add personapass.xyz
```

#### 5. Set Environment Variables
```bash
vercel env pull .env.production
```

### Option 2: AWS Deployment

#### 1. Build Application
```bash
npm run build
```

#### 2. Create Docker Image
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

#### 3. Push to ECR
```bash
docker build -t personapass .
docker tag personapass:latest xxx.dkr.ecr.us-east-1.amazonaws.com/personapass:latest
docker push xxx.dkr.ecr.us-east-1.amazonaws.com/personapass:latest
```

#### 4. Deploy with ECS/Fargate
Use the AWS Console or CLI to create an ECS service with the pushed image.

---

## 💳 Stripe Configuration

### 1. Create Product & Price
```bash
# Using Stripe CLI
stripe products create \
  --name="Age Verification" \
  --description="Privacy-preserving age verification"

stripe prices create \
  --product=prod_xxx \
  --unit-amount=5 \
  --currency=usd \
  --recurring[interval]=month \
  --recurring[usage_type]=metered
```

### 2. Configure Webhook Endpoint
```bash
stripe webhooks create \
  --url https://personapass.xyz/api/stripe/webhook \
  --enabled-events checkout.session.completed,customer.subscription.created,invoice.payment_succeeded
```

### 3. Test Webhook
```bash
stripe trigger checkout.session.completed
```

---

## 🔐 PersonaChain Setup

### 1. Deploy Smart Contracts
```bash
cd contracts
npm run deploy:mainnet
```

### 2. Verify Contracts
```bash
npm run verify:mainnet
```

### 3. Update Contract Addresses
Update `src/lib/blockchain/contracts.ts` with deployed addresses.

---

## 🏪 Shopify App Submission

### 1. Build Shopify App
```bash
cd shopify-app
npm run build
```

### 2. Deploy App Backend
```bash
npm run deploy
```

### 3. Submit to App Store
1. Go to partners.shopify.com
2. Create new app listing
3. Fill in app details
4. Submit for review

---

## 📊 Monitoring Setup

### 1. Datadog Configuration
```yaml
# datadog-agent.yaml
logs_enabled: true
apm_enabled: true
process_agent_enabled: true

tags:
  - env:production
  - service:personapass
  - version:1.0.0
```

### 2. CloudWatch Alarms
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name "PersonaPass-HighErrorRate" \
  --alarm-description "Alert when error rate exceeds 1%" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold
```

### 3. Sentry Configuration
```javascript
// sentry.client.config.js
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: "production",
  tracesSampleRate: 0.1,
  beforeSend(event) {
    // Filter out sensitive data
    return event;
  },
});
```

---

## 🚨 Production Checklist

### Security
- [ ] Enable rate limiting
- [ ] Configure CORS properly
- [ ] Set secure headers
- [ ] Enable HTTPS only
- [ ] Rotate all secrets
- [ ] Set up WAF rules

### Performance
- [ ] Enable CDN caching
- [ ] Optimize images
- [ ] Enable compression
- [ ] Set up auto-scaling
- [ ] Configure database pooling

### Monitoring
- [ ] Set up error alerts
- [ ] Configure uptime monitoring
- [ ] Enable performance tracking
- [ ] Set up log aggregation
- [ ] Create custom dashboards

### Backup & Recovery
- [ ] Database backups configured
- [ ] Disaster recovery plan
- [ ] Rollback procedures documented
- [ ] Data export functionality

---

## 🔄 Deployment Commands

### Quick Deploy
```bash
# Full deployment
npm run deploy:production

# Frontend only
npm run deploy:frontend

# Backend only
npm run deploy:backend

# Database migrations
npm run migrate:production
```

### Rollback
```bash
# Rollback to previous version
vercel rollback

# Rollback database
npm run migrate:rollback
```

### Health Checks
```bash
# Check all services
npm run health:check

# Individual checks
curl https://personapass.xyz/api/health
curl https://personapass.xyz/api/stripe/health
curl https://personapass.xyz/api/blockchain/health
```

---

## 🆘 Troubleshooting

### Common Issues

#### 1. Stripe Webhook Failures
```bash
# Check webhook logs
stripe webhooks list
stripe events list --limit 10

# Replay failed events
stripe events resend evt_xxx
```

#### 2. Database Connection Issues
```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Check pool status
npm run db:pool:status
```

#### 3. ZK Circuit Errors
```bash
# Rebuild circuits
cd circuits && ./build.sh --clean

# Verify setup
npm run circuits:verify
```

---

## 📞 Support Contacts

- **Technical Issues**: tech@personapass.xyz
- **Stripe Support**: support.stripe.com
- **Vercel Support**: vercel.com/support
- **Emergency**: +1-XXX-XXX-XXXX (CTO direct)

---

## 🎯 Post-Deployment

1. **Test Everything**
   - Complete merchant signup flow
   - Process test verification
   - Check billing flow
   - Verify analytics tracking

2. **Monitor First 24 Hours**
   - Watch error rates
   - Check conversion metrics
   - Monitor performance
   - Review user feedback

3. **Optimize**
   - A/B test checkout flow
   - Optimize loading times
   - Refine error messages
   - Improve documentation

Good luck with your launch! 🚀