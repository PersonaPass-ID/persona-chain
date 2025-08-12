#!/bin/bash

# 🧹 PersonaPass AWS Resource Cleanup Script
# Remove unnecessary resources to save costs

echo "🧹 Starting PersonaPass resource cleanup..."

# =============================================================================
# KEEP THESE ESSENTIAL RESOURCES:
# =============================================================================
echo "✅ KEEPING Essential Resources:"
echo "  - personachain-validator-1 (i-07c15f8cffb2667fb) - Working RPC"  
echo "  - personachain-validator-2 (i-0a58d95411adac35f) - Consensus"
echo "  - personachain-validator-3 (i-0a6afb56c21c13b55) - Consensus"
echo "  - persona-api-gateway (i-03fce61e736a1cd9a) - Core API"
echo "  - persona-zk-prover (i-053f88c9eb8984b75) - ZK proofs"
echo ""

# =============================================================================
# OPTIONAL CLEANUP - UNCOMMENT TO REMOVE
# =============================================================================
echo "❓ OPTIONAL Resources (not removing automatically):"
echo "  - prometheus-monitoring-server (i-0964bb6d8b5986ce0) - Monitoring"
echo "  - 2x persona-compute-service - What are these for?"

# =============================================================================
# REMOVE EXTRA LOAD BALANCERS
# =============================================================================
echo "🗑️  REMOVING Extra Load Balancers:"

# List of extra load balancers (keeping persona-prod-alb)
EXTRA_LBS=(
  "personapass-production-alb"
  "persona-compute-alb" 
  "personapass-api-lb"
  "personapass-public-1754436365"
  "personapass-public-1754436399"
  "personapass-public-1754437419"
)

for lb in "${EXTRA_LBS[@]}"; do
  echo "  - Checking $lb..."
  LB_ARN=$(aws elbv2 describe-load-balancers --names "$lb" --query 'LoadBalancers[0].LoadBalancerArn' --output text 2>/dev/null)
  
  if [ "$LB_ARN" != "None" ] && [ "$LB_ARN" != "" ]; then
    echo "  - Found $lb, would delete (commented out for safety)"
    # Uncomment to actually delete:
    # aws elbv2 delete-load-balancer --load-balancer-arn "$LB_ARN"
    # echo "  ✅ Deleted $lb"
  else
    echo "  - $lb not found or already deleted"
  fi
done

# =============================================================================
# SUMMARY 
# =============================================================================
echo ""
echo "🎯 SUMMARY:"
echo "✅ Essential PersonaChain infrastructure preserved"
echo "✅ Token configuration fixed to use \$ID (uid)"
echo "✅ Working validator: 3.95.230.14:26657"
echo ""
echo "💰 COST SAVINGS:"
echo "  - Current: ~\$50-80/month for all resources"
echo "  - After cleanup: ~\$30-40/month"
echo ""
echo "⚠️  To actually delete extra resources:"
echo "  1. Uncomment deletion commands in this script"
echo "  2. Run: bash cleanup-aws-resources.sh"
echo ""
echo "🔍 TO CHECK WHAT'S STILL RUNNING:"
echo "aws ec2 describe-instances --query 'Reservations[*].Instances[*].[InstanceId,State.Name,InstanceType,Tags[?Key==\`Name\`].Value|[0]]' --output table"