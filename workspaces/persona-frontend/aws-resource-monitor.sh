#!/bin/bash

# AWS Resource Monitor & Management CLI
# Helps track AWS credits and manage PersonaChain infrastructure

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 PersonaChain AWS Resource Monitor${NC}"
echo "=================================================="

# Function to check AWS credits
check_credits() {
    echo -e "\n${YELLOW}💰 AWS Credits Status:${NC}"
    aws billing get-cost-and-usage \
        --time-period Start=2025-08-01,End=2025-08-12 \
        --granularity MONTHLY \
        --metrics BlendedCost \
        --group-by Type=DIMENSION,Key=SERVICE \
        --query 'ResultsByTime[0].Groups[?Group==`Amazon Elastic Compute Cloud - Compute`].Metrics.BlendedCost.Amount' \
        --output text 2>/dev/null || echo "Unable to fetch billing data (need permissions)"
}

# Function to list EC2 instances
list_instances() {
    echo -e "\n${YELLOW}🖥️  EC2 Instances:${NC}"
    aws ec2 describe-instances \
        --query 'Reservations[*].Instances[*].[InstanceId,State.Name,InstanceType,Tags[?Key==`Name`].Value|[0],LaunchTime]' \
        --output table
}

# Function to stop instances
stop_instances() {
    echo -e "\n${RED}🛑 Stopping excessive validator instances...${NC}"
    
    # Keep only the first validator and sentry node
    local instances_to_stop=(
        "i-002ba0df5670e9fa5"  # PersonaChain-Validator-2 
        "i-0499ab0f66f44c1ed"  # PersonaChain-Validator-4
        "i-076162cfade5b2bbc"  # PersonaChain-Validator-3
        "i-09bbdeb0092da2405"  # PersonaChain-Validator (old)
        "i-094bcf4463cf5d6c4"  # personachain-validator-2 (duplicate)
    )
    
    for instance in "${instances_to_stop[@]}"; do
        echo "Stopping instance: $instance"
        aws ec2 stop-instances --instance-ids "$instance"
    done
    
    echo -e "${GREEN}✅ Stopped excessive instances. Keeping:${NC}"
    echo "  - i-0b19b3bf58af9af04 (personachain-validator-1)"
    echo "  - i-003b1d1512ed698d8 (personachain-validator-1 backup)"  
    echo "  - i-06f50b82721f716a7 (personapass-sentry-1)"
}

# Function to show cost optimization recommendations
show_recommendations() {
    echo -e "\n${YELLOW}💡 Cost Optimization Recommendations:${NC}"
    echo "1. Use t3.micro for development validators (saves 50% vs t3.medium)"
    echo "2. Stop instances when not actively developing"
    echo "3. Use spot instances for non-critical testing"
    echo "4. Monitor with CloudWatch to track usage"
}

# Function to check Lambda functions
check_lambdas() {
    echo -e "\n${YELLOW}⚡ Lambda Functions:${NC}"
    aws lambda list-functions --query 'Functions[].FunctionName' --output table
}

# Main menu
case "$1" in
    "credits")
        check_credits
        ;;
    "list")
        list_instances
        ;;
    "stop-excess")
        stop_instances
        ;;
    "lambdas")
        check_lambdas
        ;;
    "optimize")
        show_recommendations
        ;;
    "all")
        check_credits
        list_instances
        check_lambdas
        show_recommendations
        ;;
    *)
        echo "Usage: $0 {credits|list|stop-excess|lambdas|optimize|all}"
        echo ""
        echo "Commands:"
        echo "  credits     - Check AWS credits/billing"
        echo "  list        - List all EC2 instances"
        echo "  stop-excess - Stop unnecessary validator instances"
        echo "  lambdas     - List Lambda functions"
        echo "  optimize    - Show cost optimization tips"
        echo "  all         - Run all checks"
        ;;
esac