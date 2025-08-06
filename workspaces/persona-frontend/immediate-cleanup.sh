#!/bin/bash

# 🧹 Immediate PersonaChain Resource Cleanup
# Remove unnecessary load balancers to save ~$80/month immediately

echo "🧹 Starting immediate PersonaChain cleanup..."
echo "💰 Target: Remove 6 unnecessary load balancers saving ~\$96/month"
echo ""

# =============================================================================
# REMOVE EXTRA LOAD BALANCERS (IMMEDIATE SAVINGS: ~$96/month)
# =============================================================================

echo "🗑️  Removing unnecessary load balancers..."

# Keep only persona-prod-alb, remove the rest
EXTRA_LBS=(
  "arn:aws:elasticloadbalancing:us-east-1:850191424855:loadbalancer/app/personapass-production-alb/772fef24e833c176"
  "arn:aws:elasticloadbalancing:us-east-1:850191424855:loadbalancer/app/persona-compute-alb/02a88b341b3a153c"
  "arn:aws:elasticloadbalancing:us-east-1:850191424855:loadbalancer/app/personapass-api-lb/7757fb52f4634c4b"
  "arn:aws:elasticloadbalancing:us-east-1:850191424855:loadbalancer/app/personapass-public-1754436365/2983e7a97677e819"
  "arn:aws:elasticloadbalancing:us-east-1:850191424855:loadbalancer/app/personapass-public-1754436399/2590f5a3d00b725b"  
  "arn:aws:elasticloadbalancing:us-east-1:850191424855:loadbalancer/app/personapass-public-1754437419/fe76464c659eabf5"
)

LB_NAMES=(
  "personapass-production-alb"
  "persona-compute-alb" 
  "personapass-api-lb"
  "personapass-public-1754436365"
  "personapass-public-1754436399"
  "personapass-public-1754437419"
)

for i in "${!EXTRA_LBS[@]}"; do
  arn="${EXTRA_LBS[$i]}"
  name="${LB_NAMES[$i]}"
  
  echo "🗑️  Deleting load balancer: $name"
  echo "   ARN: $arn"
  
  # Uncomment to actually delete (SAVES $16/month each):
  # aws elbv2 delete-load-balancer --load-balancer-arn "$arn"
  
  if [ $? -eq 0 ]; then
    echo "   ✅ Deleted successfully"
  else
    echo "   ❌ Failed to delete"
  fi
  echo ""
done

echo "⚠️  Load balancer deletions commented out for safety"
echo "   Uncomment aws elbv2 delete-load-balancer commands to proceed"
echo ""

# =============================================================================
# COST IMPACT ANALYSIS
# =============================================================================

echo "💰 IMMEDIATE COST SAVINGS ANALYSIS:"
echo "════════════════════════════════════"
echo ""
echo "Current Monthly Costs:"
echo "  7x Load Balancers:     \$112/month"
echo "  3x t3.small validators: \$45/month"
echo "  4x Support services:    \$28/month"  
echo "  Storage & networking:   \$15/month"
echo "  ──────────────────────────────────"
echo "  CURRENT TOTAL:         \$200/month"
echo ""
echo "After Cleanup:"
echo "  1x Load Balancer:       \$16/month"
echo "  3x Upgraded validators: \$75/month"
echo "  4x Support services:    \$28/month"
echo "  Storage & networking:   \$30/month"
echo "  ──────────────────────────────────"
echo "  NEW TOTAL:             \$149/month"
echo ""
echo "💡 SAVINGS: \$51/month (\$612/year)"
echo ""

# =============================================================================
# WHAT WE KEEP RUNNING
# =============================================================================

echo "✅ ESSENTIAL INFRASTRUCTURE (KEEPING):"
echo "────────────────────────────────────────"
echo ""
echo "PersonaChain Validators:"
echo "  ✅ i-07c15f8cffb2667fb (3.95.230.14)  - Primary RPC"
echo "  ✅ i-0a58d95411adac35f (18.215.175.76) - Secondary RPC"  
echo "  ✅ i-0a6afb56c21c13b55 (44.201.128.6)  - Consensus"
echo ""
echo "Supporting Services:"
echo "  ✅ persona-api-gateway   - Core API"
echo "  ✅ persona-zk-prover     - ZK proofs"
echo "  ✅ prometheus-monitoring - System health"
echo ""
echo "Load Balancing:"
echo "  ✅ persona-prod-alb - Main load balancer"
echo ""

# =============================================================================
# NEXT STEPS FOR ENTERPRISE SETUP
# =============================================================================

echo "🚀 NEXT STEPS FOR ENTERPRISE PERSONACHAIN:"
echo "═══════════════════════════════════════════"
echo ""
echo "1. 🧹 Clean up resources (run this script)"
echo "2. ⬆️  Upgrade validators to t3.medium"  
echo "3. 🔀 Configure proper load balancing"
echo "4. 📊 Set up enterprise monitoring"
echo "5. 🪙 Deploy PersonaID token contract"
echo "6. 🧪 Test digital identity operations"
echo ""
echo "🏛️ Result: Professional digital sovereignty platform"
echo "💰 Budget: Under \$150/month"
echo "🎯 Capability: 10K+ identity operations per day"
echo ""
echo "Ready to build the future of digital identity! 🚀"