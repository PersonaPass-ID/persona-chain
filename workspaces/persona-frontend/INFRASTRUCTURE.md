# Infrastructure Setup Guide

This guide covers setting up AWS services, Digital Ocean blockchain nodes, and production deployment for the Persona Identity Platform.

## 🚀 Quick Deployment to personapass.xyz

### 1. Vercel Deployment

1. **Connect GitHub to Vercel**
   ```bash
   # Visit https://vercel.com/new
   # Import: PersonaPass-ID/persona-website
   # Root Directory: workspaces/persona-frontend
   ```

2. **Environment Variables in Vercel**
   ```bash
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_from_walletconnect_cloud
   ```

3. **Custom Domain Setup**
   ```bash
   # In Vercel Dashboard > Settings > Domains
   # Add: personapass.xyz
   # Add: www.personapass.xyz
   
   # DNS Records (at your domain provider):
   # A record: @ -> 76.76.19.19
   # CNAME: www -> cname.vercel-dns.com
   ```

## 🔗 Blockchain Infrastructure (Digital Ocean)

### 1. Digital Ocean Droplet Setup

```bash
# Create a Digital Ocean droplet (8GB RAM, 4 vCPUs recommended)
# Ubuntu 22.04 LTS

# SSH into your droplet
ssh root@your_droplet_ip

# Update system
apt update && apt upgrade -y
```

### 2. Blockchain Node Setup

```bash
# Install Node.js 20+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt-get install -y nodejs

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

### 3. Ethereum Node (Geth)

```yaml
# docker-compose.yml for Ethereum node
version: '3.8'
services:
  geth:
    image: ethereum/client-go:latest
    container_name: geth-node
    command: |
      --http 
      --http.addr 0.0.0.0 
      --http.port 8545 
      --http.corsdomain "*" 
      --http.api "eth,net,web3,personal,admin,miner" 
      --ws 
      --ws.addr 0.0.0.0 
      --ws.port 8546 
      --ws.origins "*" 
      --ws.api "eth,net,web3,personal,admin,miner"
      --syncmode fast
      --cache 2048
    ports:
      - "8545:8545"
      - "8546:8546"
      - "30303:30303"
    volumes:
      - geth-data:/root/.ethereum
    restart: unless-stopped

volumes:
  geth-data:
```

### 4. Start Blockchain Infrastructure

```bash
# Start the node
docker-compose up -d

# Check logs
docker-compose logs -f geth

# Your node will be available at:
# HTTP: http://your_droplet_ip:8545
# WebSocket: ws://your_droplet_ip:8546
```

## ☁️ AWS Services Integration

### 1. AWS Lambda Functions

```typescript
// aws/lambda/verify-credential.ts
export const handler = async (event: any) => {
  const { credentialData, proof } = JSON.parse(event.body);
  
  // Verify ZK proof logic
  const isValid = await verifyZKProof(credentialData, proof);
  
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': 'https://personapass.xyz',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      valid: isValid,
      timestamp: new Date().toISOString()
    }),
  };
};
```

### 2. AWS DynamoDB Schema

```typescript
// Table: persona-credentials
{
  PK: "USER#" + walletAddress,     // Partition Key
  SK: "CREDENTIAL#" + credentialId, // Sort Key
  credentialType: "identity_verification",
  issueDate: "2024-01-01T00:00:00Z",
  expiryDate: "2025-01-01T00:00:00Z",
  status: "active",
  zkProofHash: "0x...",
  metadata: {
    authMethod: "wallet|email|phone",
    verificationLevel: "basic|enhanced|premium"
  }
}
```

### 3. AWS API Gateway Configuration

```yaml
# serverless.yml
service: persona-identity-api

provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1
  stage: ${opt:stage, 'dev'}
  
functions:
  verifyCredential:
    handler: src/lambda/verify-credential.handler
    events:
      - http:
          path: /api/verify
          method: post
          cors: true
          
  issueCredential:
    handler: src/lambda/issue-credential.handler
    events:
      - http:
          path: /api/issue
          method: post
          cors: true

resources:
  Resources:
    PersonaCredentialsTable:
      Type: AWS::DynamoDB::Table
      Properties:
        TableName: persona-credentials-${self:provider.stage}
        BillingMode: PAY_PER_REQUEST
        AttributeDefinitions:
          - AttributeName: PK
            AttributeType: S
          - AttributeName: SK
            AttributeType: S
        KeySchema:
          - AttributeName: PK
            KeyType: HASH
          - AttributeName: SK
            KeyType: RANGE
```

### 4. AWS S3 for Static Assets

```bash
# Create S3 bucket for credential schemas
aws s3 mb s3://persona-credential-schemas

# Upload schema files
aws s3 sync ./schemas s3://persona-credential-schemas/schemas --acl public-read
```

### 5. AWS SES for Email Verification

```typescript
// aws/lambda/send-verification-email.ts
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const ses = new SESClient({ region: "us-east-1" });

export const handler = async (event: any) => {
  const { email, verificationCode } = JSON.parse(event.body);
  
  const params = {
    Source: "noreply@personapass.xyz",
    Destination: { ToAddresses: [email] },
    Message: {
      Subject: { Data: "Persona Verification Code" },
      Body: {
        Html: {
          Data: `
            <h2>Your Persona Verification Code</h2>
            <p>Your verification code is: <strong>${verificationCode}</strong></p>
            <p>This code expires in 10 minutes.</p>
          `
        }
      }
    }
  };
  
  await ses.send(new SendEmailCommand(params));
  
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Email sent successfully" })
  };
};
```

### 6. AWS SNS for SMS Verification

```typescript
// aws/lambda/send-verification-sms.ts
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

const sns = new SNSClient({ region: "us-east-1" });

export const handler = async (event: any) => {
  const { phoneNumber, verificationCode } = JSON.parse(event.body);
  
  const params = {
    PhoneNumber: phoneNumber,
    Message: `Your Persona verification code is: ${verificationCode}. Valid for 10 minutes.`
  };
  
  await sns.send(new PublishCommand(params));
  
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "SMS sent successfully" })
  };
};
```

## 🔐 Environment Configuration

### Frontend Environment Variables (.env.local)
```bash
# WalletConnect
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id

# AWS API Gateway
NEXT_PUBLIC_API_ENDPOINT=https://your-api-id.execute-api.us-east-1.amazonaws.com/prod

# Blockchain RPC Endpoints
NEXT_PUBLIC_ETHEREUM_RPC=http://your_droplet_ip:8545
NEXT_PUBLIC_BASE_RPC=https://base-mainnet.g.alchemy.com/v2/your_alchemy_key
NEXT_PUBLIC_OPTIMISM_RPC=https://opt-mainnet.g.alchemy.com/v2/your_alchemy_key

# Environment
NEXT_PUBLIC_ENVIRONMENT=production
```

### AWS Lambda Environment Variables
```bash
# DynamoDB
DYNAMODB_TABLE_NAME=persona-credentials-prod
AWS_REGION=us-east-1

# SES
SES_FROM_EMAIL=noreply@personapass.xyz

# Security
JWT_SECRET=your_super_secure_jwt_secret
ENCRYPTION_KEY=your_32_character_encryption_key
```

## 🚀 Deployment Pipeline

### 1. GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - name: Install and Build
        run: |
          cd workspaces/persona-frontend
          npm ci
          npm run build
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./workspaces/persona-frontend

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy AWS Lambda
        run: |
          npm install -g serverless
          cd aws
          npm ci
          serverless deploy --stage prod
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

## 🔒 Security Hardening

### 1. Firewall Configuration (Digital Ocean)
```bash
# UFW firewall setup
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 8545  # Ethereum RPC
ufw allow 8546  # Ethereum WebSocket
ufw allow 443   # HTTPS
ufw enable
```

### 2. Nginx Reverse Proxy
```nginx
# /etc/nginx/sites-available/blockchain-api
server {
    listen 443 ssl;
    server_name blockchain-api.personapass.xyz;
    
    ssl_certificate /etc/letsencrypt/live/blockchain-api.personapass.xyz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/blockchain-api.personapass.xyz/privkey.pem;
    
    location / {
        proxy_pass http://localhost:8545;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 3. SSL Certificate Setup
```bash
# Install Certbot
apt install certbot python3-certbot-nginx

# Get SSL certificate
certbot --nginx -d blockchain-api.personapass.xyz
```

## 📊 Monitoring & Logging

### 1. AWS CloudWatch
```typescript
// Monitor Lambda functions
const cloudWatch = new CloudWatchClient({ region: "us-east-1" });

// Custom metrics
await cloudWatch.send(new PutMetricDataCommand({
  Namespace: "Persona/Identity",
  MetricData: [{
    MetricName: "CredentialVerifications",
    Value: 1,
    Unit: "Count"
  }]
}));
```

### 2. Digital Ocean Monitoring
```bash
# Install monitoring agent
curl -sSL https://agent.digitalocean.com/install.sh | sh

# Configure monitoring
echo "YOUR_DO_MONITORING_TOKEN" > /opt/digitalocean/do-agent/plugins-enabled/monitoring.conf
systemctl restart do-agent
```

## 🔄 Backup & Recovery

### 1. Database Backups
```bash
# DynamoDB backup
aws dynamodb create-backup \
  --table-name persona-credentials-prod \
  --backup-name "daily-backup-$(date +%Y%m%d)"
```

### 2. Blockchain Data Backups
```bash
# Create backup script
cat > /root/backup-blockchain.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d)
docker-compose stop geth
tar -czf /backups/geth-data-$DATE.tar.gz /var/lib/docker/volumes/geth-data
docker-compose start geth
EOF

chmod +x /root/backup-blockchain.sh

# Add to crontab for daily backups
echo "0 2 * * * /root/backup-blockchain.sh" | crontab -
```

## 🚀 Go Live Checklist

### Pre-Launch
- [ ] Domain purchased and DNS configured
- [ ] SSL certificates installed
- [ ] Environment variables set in Vercel
- [ ] AWS services deployed and tested
- [ ] Blockchain node synced and accessible
- [ ] Email/SMS services configured
- [ ] Security audit completed

### Launch Day
- [ ] Deploy to production
- [ ] Monitor error rates
- [ ] Test all authentication flows
- [ ] Verify wallet connections work
- [ ] Check credential generation
- [ ] Monitor performance metrics

### Post-Launch
- [ ] Set up monitoring alerts
- [ ] Configure backup schedules
- [ ] Document incident response procedures
- [ ] Plan scaling strategies

---

This infrastructure will give you a production-ready Persona Identity Platform on personapass.xyz with full blockchain integration and AWS backing.