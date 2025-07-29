#!/bin/bash

# Persona Identity Platform - Deployment Script
# This script helps automate the deployment process to Vercel

set -e

echo "🚀 Persona Identity Platform - Deployment Script"
echo "================================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the persona-frontend directory."
    exit 1
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Build the project locally first to catch any errors
echo "🔨 Building project locally..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Local build successful!"
else
    echo "❌ Local build failed. Please fix errors before deploying."
    exit 1
fi

# Run type checking
echo "🔍 Running TypeScript checks..."
npm run type-check

# Run linting
echo "🧹 Running ESLint..."
npm run lint

echo "✅ All checks passed!"

# Ask user which deployment type they want
echo ""
echo "Select deployment type:"
echo "1) Preview deployment (for testing)"
echo "2) Production deployment (live site)"
read -p "Enter your choice (1 or 2): " choice

case $choice in
    1)
        echo "🚀 Deploying to preview..."
        vercel
        ;;
    2)
        echo "🚀 Deploying to production..."
        vercel --prod
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again."
        exit 1
        ;;
esac

echo ""
echo "🎉 Deployment initiated! Check your Vercel dashboard for status."
echo "📱 Your site will be available at https://personapass.xyz"
echo ""
echo "Next steps:"
echo "1. Production credentials are already configured (Reown Project ID, RPC URL, API URL)"
echo "2. Configure custom domain (personapass.xyz) in Vercel dashboard"
echo "3. Set up AWS Lambda functions (see INFRASTRUCTURE.md)"
echo "4. Configure Digital Ocean blockchain node (see INFRASTRUCTURE.md)"