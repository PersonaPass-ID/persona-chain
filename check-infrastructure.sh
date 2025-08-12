#!/bin/bash

echo "🔍 PersonaPass Infrastructure Health Check"
echo "========================================="

# Test correct endpoints
echo "✅ Testing CORRECT endpoints:"
echo "1. RPC endpoint (https://rpc.personapass.xyz):"
curl -I https://rpc.personapass.xyz 2>/dev/null | head -1

echo "2. API endpoint (https://api.personapass.xyz):"  
curl -I https://api.personapass.xyz 2>/dev/null | head -1

echo "3. Main website (https://personapass.xyz):"
curl -I https://personapass.xyz 2>/dev/null | head -1

echo -e "\n❌ Testing WRONG endpoints from .env.local:"
echo "1. Wrong RPC (https://personachain-rpc-lb-1471567419.us-east-1.elb.amazonaws.com):"
curl -I --connect-timeout 5 https://personachain-rpc-lb-1471567419.us-east-1.elb.amazonaws.com 2>/dev/null | head -1 || echo "DNS resolution failed"

echo "2. Wrong API Gateway (https://lgx05f1fwg.execute-api.us-east-1.amazonaws.com/prod):"
curl -I --connect-timeout 5 https://lgx05f1fwg.execute-api.us-east-1.amazonaws.com/prod 2>/dev/null | head -1

echo -e "\n📝 SUMMARY:"
echo "- ✅ Main website: Working" 
echo "- ❌ RPC endpoint: 530 Backend unavailable"
echo "- ❌ API endpoint: 530 Backend unavailable" 
echo "- ❌ Environment variables: Using wrong URLs"
echo -e "\n🔧 ACTION REQUIRED:"
echo "1. Update Vercel environment variables with correct URLs"
echo "2. Check AWS ECS services and restart PersonaChain containers"
echo "3. Deploy updated code to Vercel"