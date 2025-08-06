// PersonaID Token Configuration - Auto-generated
// Generated on: 2025-08-06T19:02:03.415Z

export const PID_TOKEN_CONFIG = {
  address: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  name: "PersonaID Token",
  symbol: "PID",
  decimals: 18,
  
  network: {
    name: "hardhat",
    chainId: 31337
  },
  
  rewards: {
    verificationReward: "10",    // 10 PID per verification
    firstTimeBonus: "20",        // 20 PID for first verification
    monthlyKYCReward: "100",     // 100 PID monthly KYC reward
    stakingRate: 800             // 8% base APY
  }
};

export const PID_TOKEN_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address,uint256) returns (bool)",
  "function approve(address,uint256) returns (bool)",
  "function allowance(address,address) view returns (uint256)",
  "function stake(uint256)",
  "function unstake(uint256)",
  "function getTotalStaked(address) view returns (uint256)",
  "function getTotalPendingRewards(address) view returns (uint256)",
  "function canClaimMonthlyKYC(address) view returns (bool)",
  "function distributeVerificationReward(address,string)",
  "function distributeMonthlyKYCReward(address)",
  "event Transfer(address indexed,address indexed,uint256)",
  "event VerificationReward(address indexed,uint256,string)"
];
