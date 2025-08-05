#!/bin/bash

# PersonaPass Demo Launch Script
# Quick way to showcase the age verification product

echo "🚀 Launching PersonaPass Age Verification Demo"
echo "==========================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Navigate to frontend directory
cd "$(dirname "$0")/.." || exit

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Create demo environment file if it doesn't exist
if [ ! -f ".env.local" ]; then
    echo "🔧 Creating demo environment configuration..."
    cat > .env.local << EOL
# Demo Environment Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51234567890abcdefghijklmnopqrstuvwxyz
NEXT_PUBLIC_GA_ID=G-DEMO123456
NEXT_PUBLIC_PERSONACHAIN_RPC=https://personachain-rpc-lb-1471567419.us-east-1.elb.amazonaws.com
NEXT_PUBLIC_DEMO_MODE=true

# API Keys (test mode)
STRIPE_SECRET_KEY=sk_test_51234567890abcdefghijklmnopqrstuvwxyz
JWT_SECRET=demo-secret-key-do-not-use-in-production
DATABASE_URL=postgresql://demo:demo@localhost:5432/personapass

# PersonaChain Demo
PERSONACHAIN_MNEMONIC="test test test test test test test test test test test junk"
EOL
fi

echo ""
echo "🎯 Demo Pages Available:"
echo "========================"
echo "🏠 Landing Page:     http://localhost:3000/"
echo "🛍️  Demo Store:       http://localhost:3000/demo"
echo "💼 Merchant Signup:  http://localhost:3000/merchant/onboard"
echo "📊 Dashboard:        http://localhost:3000/merchant/dashboard"
echo ""
echo "📱 Test Scenarios:"
echo "=================="
echo "1. Visit the demo store at /demo"
echo "2. Try to purchase an age-restricted product"
echo "3. Complete age verification (instant in demo mode)"
echo "4. See the live stats update in real-time"
echo ""
echo "💡 Tips:"
echo "========"
echo "- Click 'Show Live Stats' to see real-time metrics"
echo "- All verifications succeed instantly in demo mode"
echo "- Use merchant onboarding to see the full flow"
echo ""

# Start the development server
echo "🌐 Starting development server..."
echo "================================"
npm run dev
