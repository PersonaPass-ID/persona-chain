# 🔐 KYC Provider Setup Guide

Complete setup guide for PersonaPass multi-provider KYC system.

## Overview

PersonaPass uses **4 KYC providers** for redundancy, cost optimization, and global coverage:

1. **Persona** (Premium, US/CA/EU) - $5 per verification
2. **Jumio** (Global, Cost-Effective) - $3 per verification  
3. **Onfido** (195+ Countries) - $4 per verification
4. **Plaid Identity** (US/CA, Bank-Based) - $2 per verification

## Provider Setup Instructions

### 1. Persona Identity Verification

**Why Use**: Premium accuracy (99.5%), excellent US/EU coverage, best fraud detection

**Setup Steps**:
1. Go to [withpersona.com](https://withpersona.com)
2. Sign up for account → Get API keys
3. Create verification template in dashboard
4. Set up webhook endpoint

**Required Environment Variables**:
```bash
PERSONA_API_KEY=test_12345... # From Persona dashboard
PERSONA_API_SECRET=secret_67890... # From Persona dashboard  
PERSONA_TEMPLATE_ID=itmpl_ABC123... # Created in dashboard
PERSONA_ENVIRONMENT=sandbox # or 'production'
PERSONA_WEBHOOK_SECRET=whsec_xyz789... # For webhook security
```

**Webhook URL**: `https://personapass.xyz/api/kyc/webhook/persona`

**Cost**: $5 per verification (premium tier)

---

### 2. Jumio KYC Suite

**Why Use**: Global coverage (200+ countries), cost-effective, fast processing

**Setup Steps**:
1. Go to [jumio.com](https://www.jumio.com)
2. Sign up → Get API credentials
3. Configure workflow in Jumio dashboard
4. Set up webhook URL

**Required Environment Variables**:
```bash
JUMIO_API_TOKEN=your_token_here # From Jumio dashboard
JUMIO_API_SECRET=your_secret_here # From Jumio dashboard
JUMIO_ENVIRONMENT=sandbox # or 'production'
JUMIO_WEBHOOK_SECRET=your_webhook_secret_here # For webhook security
```

**Webhook URL**: `https://personapass.xyz/api/kyc/webhook/jumio`

**Cost**: $3 per verification (cost-effective)

---

### 3. Onfido Document Verification

**Why Use**: Excellent global coverage (195+ countries), mobile-first experience

**Setup Steps**:
1. Go to [onfido.com](https://onfido.com)
2. Sign up → Get API token
3. Set up webhook token in dashboard
4. Configure document types

**Required Environment Variables**:
```bash
ONFIDO_API_TOKEN=test_abc123... # From Onfido dashboard
ONFIDO_WEBHOOK_TOKEN=whsec_def456... # For webhook security
ONFIDO_ENVIRONMENT=sandbox # or 'live'
```

**Webhook URL**: `https://personapass.xyz/api/kyc/webhook/onfido`

**Cost**: $4 per verification (premium global coverage)

---

### 4. Plaid Identity Verification

**Why Use**: Bank-grade verification, lowest cost, high completion rates (US/CA only)

**Setup Steps**:
1. Go to [plaid.com](https://plaid.com)
2. Sign up for Plaid Dashboard
3. Create app → Get client ID and secret
4. Enable Identity Verification product

**Required Environment Variables**:
```bash
PLAID_CLIENT_ID=your_client_id # From Plaid dashboard
PLAID_SECRET=your_secret_key # From Plaid dashboard
PLAID_ENVIRONMENT=sandbox # 'sandbox', 'development', or 'production'
```

**Webhook URL**: `https://personapass.xyz/api/kyc/webhook/plaid`

**Cost**: $2 per verification (most cost-effective)

## Quick Start (Recommended)

**For immediate testing**, start with **Persona** (best for US) and **Jumio** (global):

### Step 1: Persona Setup
1. Sign up at [withpersona.com](https://withpersona.com)
2. Get sandbox API key
3. Create basic identity verification template
4. Add credentials to `.env.local`

### Step 2: Jumio Setup  
1. Sign up at [jumio.com](https://www.jumio.com)
2. Get sandbox credentials
3. Add to `.env.local`

### Step 3: Test
```bash
npm run dev
# Go to http://localhost:3001/dashboard
# Click "Identity Verification" tab
# Try verification with both providers
```

## Multi-Provider Benefits

### 1. **Automatic Failover**
- If Persona is down → Auto-switch to Jumio
- If provider at capacity → Use next available
- User never sees errors, seamless experience

### 2. **Cost Optimization**  
- Plaid: $2 (US/CA bank-based)
- Jumio: $3 (global, fast)
- Onfido: $4 (premium global)
- Persona: $5 (premium US/EU)

### 3. **Geographic Coverage**
- US/CA: All 4 providers available
- Europe: Persona, Jumio, Onfido
- Global: Jumio, Onfido  
- System auto-selects best provider per region

### 4. **Load Balancing**
- Automatic distribution across providers
- Prevents overloading single provider
- Maintains high availability

## Provider Comparison Matrix

| Provider | Cost | Global | US/EU | Processing | Accuracy | Documents |
|----------|------|--------|-------|------------|----------|-----------|
| Persona | $5 | ❌ | ✅ | 2-5min | 99.5% | Gov ID + Selfie |
| Jumio | $3 | ✅ | ✅ | 1-3min | 99.2% | 200+ Doc Types |
| Onfido | $4 | ✅ | ✅ | 30s-2min | 98.8% | Global Documents |
| Plaid | $2 | ❌ | ✅ | 10-30s | 96.5% | Bank + Gov ID |

## Environment Setup

### Development (.env.local)
```bash
# Copy all KYC provider variables from .env.local
# Set to 'sandbox' environments for testing
```

### Production (Vercel Dashboard)
```bash
# Set all variables in Vercel dashboard
# Change environments to 'production'/'live'
# Use production API keys from each provider
```

## Testing Strategy

### Phase 1: Single Provider
1. Start with Persona (US) or Jumio (Global)
2. Test basic identity verification
3. Verify webhook processing
4. Test free token claiming

### Phase 2: Multi-Provider
1. Add second provider (Jumio if started with Persona)
2. Test automatic failover
3. Test provider selection logic
4. Verify cost optimization

### Phase 3: Production
1. Get production API keys from all providers
2. Update environment variables
3. Test with small group of real users
4. Monitor provider performance and costs

## Webhook Security

All providers use webhook signatures for security:

- **Persona**: HMAC SHA256 with timestamp
- **Jumio**: HMAC SHA256 
- **Onfido**: HMAC SHA256
- **Plaid**: JWT verification

PersonaPass validates all webhook signatures before processing.

## Monitoring & Analytics

The system provides:

- **Real-time provider stats**: Load, capacity, performance
- **Cost tracking**: Per-provider verification costs
- **Success rates**: Verification completion rates
- **Geographic analytics**: Provider performance by region
- **Failure analysis**: Automatic retry and failover logging

## Next Steps

1. **Choose 1-2 providers to start** (recommend Persona + Jumio)
2. **Get sandbox API keys** from chosen providers  
3. **Add environment variables** to `.env.local`
4. **Test verification flow** on dashboard
5. **Implement webhook handling** for real-time updates
6. **Monitor performance** and add more providers as needed

## Support & Documentation

- **Persona**: [docs.withpersona.com](https://docs.withpersona.com)
- **Jumio**: [github.com/Jumio/implementation-guides](https://github.com/Jumio/implementation-guides)
- **Onfido**: [documentation.onfido.com](https://documentation.onfido.com)
- **Plaid**: [plaid.com/docs/identity-verification](https://plaid.com/docs/identity-verification)

---

**Ready to get started?** Choose your first provider and I'll help you configure the API keys! 🚀