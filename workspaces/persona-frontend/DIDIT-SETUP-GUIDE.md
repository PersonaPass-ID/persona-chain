# 🆓 Didit KYC Setup Guide - LIVE CREDENTIALS CONFIGURED!

## ✅ Your Credentials (Already Added to .env.local)

```bash
API_KEY: uklr7JG0g-ymc7cJRTUNawK9op2p40nsMR3aARozcwY ✅
WEBHOOK_SECRET: 1zkaMW9sInyOWNAjqdSJbmpu_jmFK2m1QSYVgRH3eOA ✅
WORKFLOW_ID: [Need to find this] ⚠️
```

## Quick Setup (2 minutes remaining)

### Step 1: Find Your Workflow ID
1. **In Didit Business Console**:
   - Go to your Didit Business Console dashboard
   - Navigate to "Workflows" or "Templates" section
   - Look for your default workflow ID (starts with `wf_` or similar)
   - Copy the workflow ID for your environment

2. **Alternative - Test API Connection**:
   ```bash
   # Start your dev server
   npm run dev
   
   # Open this URL in browser
   http://localhost:3001/api/kyc/didit/test-connection
   ```
3. **Update .env.local** with the workflow ID you find

### Step 2: Update Environment Variables
Replace the placeholders in `.env.local`:

```bash
# Replace these with your actual Didit credentials
DIDIT_API_KEY=your_actual_api_key_here
DIDIT_WORKFLOW_ID=your_actual_workflow_id_here  
DIDIT_WEBHOOK_SECRET=your_actual_webhook_secret_here
DIDIT_ENVIRONMENT=sandbox  # Change to 'production' when ready
```

### Step 3: Test Integration
```bash
# Start development server
npm run dev

# Navigate to KYC page
http://localhost:3001/dashboard

# Try the "Start FREE Verification" button
```

## API Endpoint Structure

Based on your documentation, Didit uses:

### Create Session Endpoint
```
POST https://verification.didit.me/v2/session/
```

### Request Format
```json
{
  "workflow_id": "your_workflow_id",
  "vendor_data": {
    "reference_id": "user_wallet_address",
    "user_tier": "free"
  },
  "callback": "https://personapass.xyz/api/kyc/didit/webhook",
  "metadata": {
    "first_name": "User",
    "last_name": "Name",
    "email": "user@example.com"
  },
  "contact_details": {
    "email": "user@example.com",
    "phone": "+1234567890"
  }
}
```

### Response Format
```json
{
  "session_id": "session_12345",
  "session_url": "https://verification.didit.me/session/12345",
  "status": "created"
}
```

## FREE Features Included

✅ **Document Verification** (3000+ document types)
✅ **Facial Recognition** & matching
✅ **Passive Liveness Detection** 
✅ **Database Cross-Reference**
✅ **IP Address Analysis**
✅ **NFC Document Reading**
✅ **220+ Countries Supported**
✅ **GDPR Compliant**

## Cost Comparison

| Provider | Monthly Cost | Per Verification | PersonaPass Total |
|----------|-------------|------------------|-------------------|
| **Didit** | **$0** | **$0** | **$0/month** |
| Sumsub | $149 | $1.35 | $149+ per month |
| Persona | $0 | $5.00 | $5 per user |
| Jumio | $99 | $3.00 | $99+ per month |

**Savings with Didit**: 99%+ cost reduction

## Integration Code Files

Your Didit integration includes:

1. **Provider Class**: `/src/lib/kyc-providers/persona-didit-provider.ts`
2. **API Routes**: `/src/pages/api/kyc/didit/create-session.ts` & `webhook.ts` 
3. **React Component**: `/src/components/DiditKYCComponent.tsx`
4. **Environment Config**: `.env.local` (update with your credentials)

## Webhook Configuration

**✅ IMPORTANT**: Update your webhook URL in the Didit dashboard:

### Production Setup
```
Webhook URL: https://personapass.xyz/api/kyc/didit/webhook
Webhook Version: V.2 (recommended)
Webhook Secret: 1zkaMW9sInyOWNAjqdSJbmpu_jmFK2m1QSYVgRH3eOA
```

### Development/Testing
```  
Webhook URL: https://your-vercel-preview.vercel.app/api/kyc/didit/webhook
OR use ngrok: https://abc123.ngrok.io/api/kyc/didit/webhook
```

**Note**: Replace `https://example.com/webhook` in your Didit dashboard with the actual PersonaPass webhook URL above.

## What Happens Next

1. **User starts verification** → Creates Didit session
2. **User completes verification** → Didit sends webhook  
3. **Webhook processed** → Awards 100 ID tokens
4. **VC generated** → User gets Proof of Personhood
5. **Monthly claim** → Eligible for 100 free tokens/month

## Troubleshooting

### Common Issues
- **403 Forbidden**: Check API key format and permissions
- **Webhook not received**: Verify webhook URL is publicly accessible
- **Session creation fails**: Ensure workflow_id exists and is active

### Debug Logs
Check browser console and server logs for detailed error messages:
```bash
# Development logs
npm run dev

# Check API responses in browser Network tab
```

## Production Deployment

Before going live:
1. Change `DIDIT_ENVIRONMENT=production`
2. Update webhook URL to production domain
3. Test with real documents and credentials
4. Monitor webhook delivery in Didit dashboard

---

🎉 **Result**: Zero-cost KYC with unlimited free verifications for PersonaPass users!