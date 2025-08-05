# 🚀 Vercel Deployment Guide

## Environment Variables Setup

Copy these to your Vercel dashboard (Settings → Environment Variables):

### Required Variables
```bash
NODE_ENV=production
JWT_SECRET=persona-super-secure-jwt-secret-key
SESSION_SECRET=persona-super-secure-jwt-secret-key

# AWS DynamoDB Configuration (ALREADY DEPLOYED!)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_existing_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_existing_aws_secret_access_key
DYNAMODB_TABLE_NAME=persona-credentials-prod

# PersonaChain Configuration (ALREADY DEPLOYED!)
PERSONACHAIN_RPC_URL=http://161.35.2.88:26657
NEXT_PUBLIC_PERSONACHAIN_RPC_URL=http://161.35.2.88:26657
PERSONACHAIN_CHAIN_ID=persona-1

# Application URLs
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NEXT_PUBLIC_API_URL=https://your-app.vercel.app/api

# SendGrid Email (ALREADY CONFIGURED!)
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@personapass.xyz
```

### Optional Variables (for full functionality)
```bash
STRIPE_SECRET_KEY=sk_test_your_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
API_RATE_LIMIT_WINDOW_MS=900000
API_RATE_LIMIT_MAX_REQUESTS=100
ENABLE_ANALYTICS=true
ENABLE_DEBUG_LOGGING=false
MAINTENANCE_MODE=false
```

## AWS DynamoDB Setup (Our Storage Backend)

### AWS DynamoDB Table Creation
Our PersonaPass uses AWS DynamoDB for credential storage. You need:

1. **Create DynamoDB Table:**
   ```bash
   # Table name: PersonaPassCredentials
   # Partition key: PK (String)
   # Sort key: SK (String)
   
   # Global Secondary Indexes:
   # GSI1: gsi1pk (PK), gsi1sk (SK) - for credential lookups
   # GSI2: gsi2pk (PK), gsi2sk (SK) - for type-based queries
   ```

2. **Deploy Lambda Functions:**
   - Our enhanced credential operations Lambda needs to be deployed
   - Found in: `aws/src/lambda/enhanced-credential-operations.ts`
   - Handles: storage, analytics, access tracking, backup/restore

3. **AWS IAM Permissions:**
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "dynamodb:GetItem",
           "dynamodb:PutItem",
           "dynamodb:Query",
           "dynamodb:UpdateItem",
           "dynamodb:BatchGetItem"
         ],
         "Resource": "arn:aws:dynamodb:*:*:table/PersonaPassCredentials*"
       }
     ]
   }
   ```

### AWS Setup Steps
1. **Create DynamoDB table** in AWS Console
2. **Deploy Lambda function** for credential operations
3. **Create IAM user** with DynamoDB permissions
4. **Get AWS credentials** (Access Key ID + Secret Access Key)
5. **Add to Vercel** environment variables

## Deployment Steps

1. **Import to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import `PersonaPass-ID/persona-website`

2. **Configure Environment Variables:**
   - In Vercel dashboard → Settings → Environment Variables
   - Add all required variables above
   - Generate secrets with: `openssl rand -base64 64`

3. **Deploy:**
   - Click "Deploy"
   - Vercel will build and deploy automatically
   - Check build logs for any issues

4. **Test:**
   - Visit your deployed URL
   - Test wallet connection
   - Verify all features work

## Troubleshooting

### Build Fails?
- Check all environment variables are set
- Verify DATABASE_URL is accessible
- Check build logs in Vercel

### Runtime Errors?
- Check if database migrations ran
- Verify PersonaChain RPC is accessible
- Check environment variable formatting

### Wallet Connection Issues?
- Verify NEXT_PUBLIC_* variables are set
- Check WalletConnect project ID
- Ensure HTTPS is working

## Security Checklist

- [ ] All secrets generated securely
- [ ] Database has SSL enabled
- [ ] CORS origins configured correctly
- [ ] Rate limiting enabled
- [ ] Debug logging disabled in production
- [ ] All API keys are production-ready

## Success! 🎉

Once deployed, your PersonaPass Identity Platform will be live at:
`https://your-app.vercel.app`

The application includes:
- Multi-wallet authentication
- WebAuthn biometric auth
- PersonaChain integration
- Zero-knowledge proofs
- Enterprise security features
- Professional UI/UX