# Deploy ID Token on PersonaChain

## 🪙 **PersonaChain ID Token Deployment Guide**

### Token Specifications
```yaml
Token Name: "PersonaID"
Token Symbol: "ID" 
Token Decimals: 6
Initial Supply: 1,000,000,000 ID (1 billion)
Total Supply: 10,000,000,000 ID (10 billion max)
Use Cases:
  - Identity verification fees
  - DID creation costs  
  - VC issuance payments
  - ZK proof generation
  - Governance voting
```

## 🏗️ **Deployment Steps**

### 1. Create Token Smart Contract
```javascript
// PersonaID Token Contract (CosmWasm)
{
  "name": "PersonaID Token",
  "symbol": "ID",
  "decimals": 6,
  "initial_balances": [
    {
      "address": "persona1...", // Your admin address
      "amount": "1000000000000000" // 1B tokens with 6 decimals
    }
  ],
  "mint": {
    "minter": "persona1...", // Your admin address
    "cap": "10000000000000000" // 10B max supply
  }
}
```

### 2. Deploy to PersonaChain
```bash
# Using PersonaChain CLI
personachaind tx wasm store token_contract.wasm \
  --from your-key \
  --gas 2000000 \
  --fees 50000upersona \
  --chain-id personachain-1 \
  --node https://personachain-rpc-lb-1471567419.us-east-1.elb.amazonaws.com

# Instantiate the contract
personachaind tx wasm instantiate $CODE_ID \
  '{"name":"PersonaID Token","symbol":"ID","decimals":6,"initial_balances":[{"address":"persona1...","amount":"1000000000000000"}]}' \
  --from your-key \
  --label "PersonaID Token" \
  --chain-id personachain-1 \
  --gas 1000000 \
  --fees 25000upersona
```

### 3. Add Token to Wallet Configuration
The wallets need to recognize your ID token for transactions.

### 4. Update Frontend Configuration
Update the chain config to use ID token instead of ATOM.