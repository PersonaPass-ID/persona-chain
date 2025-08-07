# DIDIT Production Setup Instructions

## 🚀 Production Configuration for PersonaPass.xyz

### 1. DIDIT Business Console Setup

#### Webhook Configuration
1. Log into your [DIDIT Business Console](https://business.didit.me/)
2. Go to **Settings** → **Webhooks**
3. Add new webhook endpoint:
   - **Webhook URL**: `https://personapass.xyz/api/kyc/didit/webhook`
   - **Webhook Secret**: `jSgs3dsvO7DR5l1ZCM7cV44ONVM0MzepLRrJdG4a50o` (from DIDIT_WEBHOOK_SECRET)
   - **Events to Subscribe**:
     - ✅ `verification_completed`
     - ✅ `verification_failed`
     - ✅ `verification_processing`
     - ✅ `session_created`

#### API Configuration
- **API Key**: `7kMi9c2-cVzKA7S182KSn5SV6hG6juqTU_bzauYO9N0`
- **Workflow ID**: `32998605-eeae-4d97-a134-90b2c4bd553e`
- **Environment**: Production
- **Permissions Required**:
  - ✅ Session Creation
  - ✅ Webhook Access
  - ✅ Verification Status Read

### 2. Environment Variables (Already Configured)

```env
# Production URLs
NEXT_PUBLIC_SITE_URL=https://personapass.xyz
NEXTAUTH_URL=https://personapass.xyz

# DIDIT Configuration  
DIDIT_API_KEY=7kMi9c2-cVzKA7S182KSn5SV6hG6juqTU_bzauYO9N0
DIDIT_WORKFLOW_ID=29082470-3248-4439-8434-83747afcb462
DIDIT_WEBHOOK_SECRET=jSgs3dsvO7DR5l1ZCM7cV44ONVM0MzepLRrJdG4a50o
DIDIT_ENVIRONMENT=production
```

### 3. API Endpoints

#### Session Creation
- **URL**: `https://verification.didit.me/v2/session/`
- **Method**: POST
- **Authentication**: Bearer token (`DIDIT_API_KEY`)

#### Webhook Endpoint
- **URL**: `https://personapass.xyz/api/kyc/didit/webhook`
- **Method**: POST
- **Security**: HMAC SHA-256 signature verification

### 4. Testing Production Setup

#### 1. Test Session Creation
```bash
curl -X POST https://personapass.xyz/api/kyc/didit/create-session \
  -H "Content-Type: application/json" \
  -d '{
    "user_address": "cosmos1test123",
    "email": "test@example.com",
    "metadata": {
      "first_name": "Test",
      "last_name": "User",
      "platform": "PersonaPass"
    }
  }'
```

#### 2. Verify Webhook URL
```bash
# Check webhook endpoint is accessible
curl -I https://personapass.xyz/api/kyc/didit/webhook
# Should return: 405 Method Not Allowed (POST only)
```

### 5. Success Criteria

✅ **Session Creation Returns**:
- `session_id`: Valid UUID
- `session_url`: DIDIT verification portal URL
- `status`: "created" or "pending"

✅ **Webhook Receives**:
- Verification completion events
- Valid HMAC signature
- User wallet address in custom_data

✅ **User Flow**:
1. User clicks "Start FREE Verification" 
2. Session created successfully
3. Verification window opens
4. User completes KYC in DIDIT portal
5. Webhook notifies PersonaPass
6. 100 ID tokens awarded
7. Verifiable Credential created

### 6. Monitoring & Logs

Check these logs for issues:
- `🔧 DIDIT Configuration:` - Environment setup
- `📤 Sending session creation request` - API calls
- `📨 Didit webhook received:` - Incoming webhooks
- `✅ KYC verification completed` - Success events

### 7. Fallback Strategy

If DIDIT fails, system automatically falls back to:
- Basic wallet-based identity verification
- Still awards 100 ID tokens
- Creates Proof of Personhood credential
- Maintains user experience continuity

---

## 🔐 Security Notes

- Webhook signatures are verified with HMAC SHA-256
- All API calls use HTTPS with Bearer authentication
- Environment variables are secured in production
- No sensitive data logged in production mode

## 📞 Support

- DIDIT Support: [business.didit.me/support](https://business.didit.me/support)
- PersonaPass Issues: Check server logs and webhook deliveries