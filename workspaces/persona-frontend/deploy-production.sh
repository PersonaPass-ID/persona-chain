#!/bin/bash

# PersonaPass Production Deployment Script
# Automates deployment to Vercel/Cloudflare with smart contract deployment

set -e

echo "🚀 PersonaPass Production Deployment"
echo "===================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check for required tools
check_dependencies() {
    echo "📋 Checking dependencies..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js is not installed${NC}"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ npm is not installed${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ All dependencies found${NC}"
}

# Generate secure secrets
generate_secrets() {
    echo "🔐 Generating secure secrets..."
    
    JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
    SESSION_SECRET=$(openssl rand -base64 64 | tr -d '\n')
    NEXTAUTH_SECRET=$(openssl rand -base64 64 | tr -d '\n')
    
    echo "JWT_SECRET=$JWT_SECRET" > .env.secrets
    echo "SESSION_SECRET=$SESSION_SECRET" >> .env.secrets
    echo "NEXTAUTH_SECRET=$NEXTAUTH_SECRET" >> .env.secrets
    
    echo -e "${GREEN}✅ Secrets generated and saved to .env.secrets${NC}"
    echo -e "${YELLOW}⚠️  Keep .env.secrets safe and never commit it!${NC}"
}

# Build the application
build_application() {
    echo "🔨 Building application..."
    
    # Install dependencies
    npm ci --production=false
    
    # Run build
    npm run build
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Build successful${NC}"
    else
        echo -e "${RED}❌ Build failed${NC}"
        exit 1
    fi
}

# Deploy smart contracts
deploy_contracts() {
    echo "📜 Deploying smart contracts..."
    
    read -p "Deploy to which network? (polygon/arbitrum/base/skip): " NETWORK
    
    if [ "$NETWORK" != "skip" ]; then
        cd contracts
        
        # Install contract dependencies
        npm install
        
        # Deploy based on network
        case $NETWORK in
            polygon)
                echo "Deploying to Polygon..."
                npx hardhat run scripts/deploy-multichain.js --network polygon
                ;;
            arbitrum)
                echo "Deploying to Arbitrum..."
                npx hardhat run scripts/deploy-multichain.js --network arbitrum
                ;;
            base)
                echo "Deploying to Base..."
                npx hardhat run scripts/deploy-multichain.js --network base
                ;;
            *)
                echo -e "${YELLOW}Skipping contract deployment${NC}"
                ;;
        esac
        
        cd ..
    fi
}

# Deploy to Vercel
deploy_vercel() {
    echo "▲ Deploying to Vercel..."
    
    # Check if Vercel CLI is installed
    if ! command -v vercel &> /dev/null; then
        echo "Installing Vercel CLI..."
        npm i -g vercel
    fi
    
    # Login to Vercel (if not already)
    vercel whoami || vercel login
    
    # Deploy to production
    vercel --prod --yes
    
    echo -e "${GREEN}✅ Deployed to Vercel${NC}"
}

# Deploy to Cloudflare Pages
deploy_cloudflare() {
    echo "☁️ Deploying to Cloudflare Pages..."
    
    # Check if Wrangler is installed
    if ! command -v wrangler &> /dev/null; then
        echo "Installing Wrangler CLI..."
        npm i -g wrangler
    fi
    
    # Build for Cloudflare
    npm run build
    
    # Deploy
    wrangler pages deploy out --project-name=personapass
    
    echo -e "${GREEN}✅ Deployed to Cloudflare Pages${NC}"
}

# Deploy Lambda functions
deploy_lambda() {
    echo "λ Deploying AWS Lambda functions..."
    
    cd aws
    
    # Install serverless if needed
    if ! command -v serverless &> /dev/null; then
        echo "Installing Serverless Framework..."
        npm i -g serverless
    fi
    
    # Install dependencies
    npm install
    
    # Deploy to production
    serverless deploy --stage prod
    
    cd ..
    
    echo -e "${GREEN}✅ Lambda functions deployed${NC}"
}

# Set environment variables
set_env_vars() {
    echo "🔧 Setting environment variables..."
    
    read -p "Deploy platform (vercel/cloudflare): " PLATFORM
    
    if [ "$PLATFORM" = "vercel" ]; then
        echo "Setting Vercel environment variables..."
        
        # Read from env.production and set each variable
        while IFS='=' read -r key value; do
            # Skip comments and empty lines
            if [[ ! "$key" =~ ^#.*$ ]] && [ -n "$key" ]; then
                vercel env add "$key" production <<< "$value"
            fi
        done < env.production
        
    elif [ "$PLATFORM" = "cloudflare" ]; then
        echo -e "${YELLOW}Please set environment variables in Cloudflare Dashboard:${NC}"
        echo "Pages > Settings > Environment Variables > Production"
    fi
}

# Run tests
run_tests() {
    echo "🧪 Running tests..."
    
    # Run unit tests
    npm test -- --watchAll=false
    
    # Run E2E tests if available
    if [ -f "playwright.config.ts" ]; then
        npm run test:e2e
    fi
    
    echo -e "${GREEN}✅ Tests passed${NC}"
}

# Health check
health_check() {
    echo "🏥 Running health checks..."
    
    read -p "Enter production URL (e.g., https://personapass.io): " PROD_URL
    
    # Check main page
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$PROD_URL")
    if [ "$HTTP_STATUS" = "200" ]; then
        echo -e "${GREEN}✅ Main page is up (HTTP $HTTP_STATUS)${NC}"
    else
        echo -e "${RED}❌ Main page returned HTTP $HTTP_STATUS${NC}"
    fi
    
    # Check API health
    API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$PROD_URL/api/health")
    if [ "$API_STATUS" = "200" ]; then
        echo -e "${GREEN}✅ API is healthy (HTTP $API_STATUS)${NC}"
    else
        echo -e "${YELLOW}⚠️  API returned HTTP $API_STATUS${NC}"
    fi
}

# Main deployment flow
main() {
    echo "🎯 Starting PersonaPass Production Deployment"
    echo ""
    
    check_dependencies
    
    # Ask what to deploy
    echo "What would you like to do?"
    echo "1) Full deployment (contracts + app)"
    echo "2) App only (skip contracts)"
    echo "3) Contracts only"
    echo "4) Generate secrets only"
    echo "5) Run tests only"
    
    read -p "Choose option (1-5): " OPTION
    
    case $OPTION in
        1)
            generate_secrets
            build_application
            run_tests
            deploy_contracts
            
            echo "Choose deployment platform:"
            echo "1) Vercel"
            echo "2) Cloudflare"
            echo "3) Both"
            read -p "Choose (1-3): " DEPLOY_PLATFORM
            
            case $DEPLOY_PLATFORM in
                1) deploy_vercel ;;
                2) deploy_cloudflare ;;
                3) 
                    deploy_vercel
                    deploy_cloudflare
                    ;;
            esac
            
            deploy_lambda
            set_env_vars
            health_check
            ;;
        2)
            build_application
            run_tests
            
            echo "Choose deployment platform:"
            echo "1) Vercel"
            echo "2) Cloudflare"
            read -p "Choose (1-2): " DEPLOY_PLATFORM
            
            case $DEPLOY_PLATFORM in
                1) deploy_vercel ;;
                2) deploy_cloudflare ;;
            esac
            
            health_check
            ;;
        3)
            deploy_contracts
            ;;
        4)
            generate_secrets
            ;;
        5)
            run_tests
            ;;
        *)
            echo -e "${RED}Invalid option${NC}"
            exit 1
            ;;
    esac
    
    echo ""
    echo -e "${GREEN}🎉 Deployment complete!${NC}"
    echo ""
    echo "📝 Post-deployment checklist:"
    echo "  □ Verify environment variables are set"
    echo "  □ Test wallet connections"
    echo "  □ Verify smart contract addresses"
    echo "  □ Check monitoring dashboards"
    echo "  □ Test payment flow"
    echo "  □ Verify ZK proofs work"
    echo "  □ Check error tracking (Sentry)"
    echo "  □ Monitor performance metrics"
    echo ""
    echo "🔗 Useful links:"
    echo "  - Vercel Dashboard: https://vercel.com/dashboard"
    echo "  - Cloudflare Dashboard: https://dash.cloudflare.com"
    echo "  - AWS Console: https://console.aws.amazon.com"
    echo "  - Stripe Dashboard: https://dashboard.stripe.com"
}

# Run main function
main "$@"