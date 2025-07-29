# Vercel Deployment Guide for personapass.xyz

## Prerequisites
- GitHub account with the persona-website repository
- Vercel account (free tier is sufficient)
- Domain access to personapass.xyz (for DNS configuration)

## Step 1: Connect Repository to Vercel

1. **Login to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with your GitHub account

2. **Import Project**
   - Click "New Project"
   - Select "Import Git Repository"
   - Choose your `PersonaPass-ID/persona-website` repository
   - Click "Import"

3. **Configure Project Settings**
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `workspaces/persona-frontend`
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)
   - **Install Command**: `npm install` (auto-detected)

## Step 2: Environment Variables

Add the following environment variables in Vercel dashboard:

```bash
# Required for Reown (formerly WalletConnect) integration
NEXT_PUBLIC_REOWN_PROJECT_ID=946b25b33d5bf1a42b32971e742ce05d

# DigitalOcean Blockchain RPC URL
NEXT_PUBLIC_RPC_URL=http://161.35.2.88:26657

# AWS Application Load Balancer URL
NEXT_PUBLIC_API_URL=https://persona-prod-alb-1378202633.us-east-1.elb.amazonaws.com

# Environment identifier
NEXT_PUBLIC_ENVIRONMENT=production

# Optional: Analytics and monitoring
VERCEL_ANALYTICS_ID=your_analytics_id
```

### Getting Reown Project ID:
1. Go to [Reown Cloud](https://cloud.reown.com/) (formerly WalletConnect Cloud)
2. Create a new project
3. Copy the Project ID
4. Add it to Vercel environment variables

**Note:** Your production Project ID is already configured: `946b25b33d5bf1a42b32971e742ce05d`

## Step 3: Custom Domain Setup

1. **In Vercel Dashboard**
   - Go to your project settings
   - Click "Domains" tab
   - Add domain: `personapass.xyz`
   - Add domain: `www.personapass.xyz` (optional)

2. **DNS Configuration**
   Add these DNS records to your domain provider:

   ```
   Type: A
   Name: @
   Value: 76.76.19.88
   TTL: 3600

   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   TTL: 3600
   ```

   Or use Vercel's nameservers for easier management:
   ```
   ns1.vercel-dns.com
   ns2.vercel-dns.com
   ```

## Step 4: Deploy

1. **Automatic Deployment**
   - Vercel automatically deploys when you push to main branch
   - Check deployment status in Vercel dashboard

2. **Manual Deployment**
   - In Vercel dashboard, go to "Deployments"
   - Click "Deploy" for manual trigger

## Step 5: Verify Deployment

1. **Check URLs**
   - Vercel URL: `https://your-project.vercel.app`
   - Custom domain: `https://personapass.xyz`

2. **Test Features**
   - Homepage loads correctly
   - Navigation works
   - "Create Persona" button routes to `/get-started`
   - Wallet connection interface functions
   - Responsive design on mobile

## Production Optimizations

### Performance
- Next.js automatically optimizes images
- Static generation for better performance
- CDN distribution via Vercel Edge Network

### Security
- HTTPS automatically enabled
- Security headers configured
- Environment variables secured

### Monitoring
- Vercel Analytics automatically tracks performance
- Real-time deployment logs
- Error monitoring and alerts

## Troubleshooting

### Common Issues

1. **Build Fails**
   - Check build logs in Vercel dashboard
   - Ensure all dependencies are in package.json
   - Verify TypeScript compilation

2. **Environment Variables**
   - Ensure NEXT_PUBLIC_ prefix for client-side variables
   - Redeploy after adding new environment variables

3. **Domain Issues**
   - DNS propagation can take up to 48 hours
   - Use DNS checker tools to verify configuration
   - Check domain SSL certificate status

4. **404 Errors**
   - Verify Next.js routing configuration
   - Check file paths and imports
   - Ensure all pages are properly exported

### Support
- Vercel Documentation: [vercel.com/docs](https://vercel.com/docs)
- Next.js Documentation: [nextjs.org/docs](https://nextjs.org/docs)
- GitHub Issues: Repository issues tab

## Next Steps After Deployment

1. **Set up WalletConnect Project ID** (currently using demo ID)
2. **Configure AWS Lambda functions** (see INFRASTRUCTURE.md)
3. **Set up Digital Ocean blockchain node** (see INFRASTRUCTURE.md)
4. **Enable real email/SMS verification**
5. **Set up analytics and monitoring**

## Deployment Commands (if using Vercel CLI)

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod

# Link project to existing Vercel project
vercel link
```

---

🚀 Your Persona Identity Platform will be live at https://personapass.xyz once deployment is complete!