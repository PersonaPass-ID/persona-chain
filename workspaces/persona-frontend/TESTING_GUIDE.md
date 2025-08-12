# PersonaPass Testing Guide

## 🎯 Current Focus: Build ONE Complete Flow Perfectly

We're taking a focused approach to build and test one complete verification flow before expanding.

## 🧪 Test Pages Created

### 1. DID Login Flow Test (`/test-did-login`)
**Purpose**: Test wallet-DID recognition and routing logic
**What it tests**:
- ✅ Wallet connection detection (Keplr, Cosmostation, Leap)
- ✅ DID lookup by wallet address
- ✅ Smart routing logic (signup/login/dashboard/onboarding)
- ✅ Error handling and edge cases

**How to test**:
1. Visit `/test-did-login`
2. Connect your wallet
3. Check if DID is found and routing is correct

### 2. GitHub API Integration Test (`/test-github`)
**Purpose**: Test complete GitHub verification flow with Personal Access Token
**What it tests**:
- ✅ GitHub API connection and authentication
- ✅ Profile data fetching and validation
- ✅ Developer level analysis (basic/experienced/expert)
- ✅ Verifiable Credential creation
- ✅ Credential storage (simulated)

### 3. GitHub OAuth Test (`/test-oauth`)
**Purpose**: Test production OAuth authentication flow
**What it tests**:
- 🔄 NextAuth.js GitHub OAuth integration
- 🔄 Session management and token handling
- 🔄 VC creation from OAuth session data
- 🔄 Production authentication workflow

**Setup required for `/test-github`**:
1. Get GitHub Personal Access Token from [GitHub Settings](https://github.com/settings/tokens)
2. Add to `.env.local`: `GITHUB_PERSONAL_ACCESS_TOKEN=your_token_here`
3. Restart dev server: `npm run dev`

**How to test `/test-github`**:
1. Visit `/test-github`
2. Enter a GitHub username (try: octocat, torvalds, or your own)
3. Run verification test
4. Check all steps complete successfully

**Setup required for `/test-oauth`**:
1. Ensure GitHub OAuth credentials are configured in `.env.local`:
   ```bash
   GITHUB_CLIENT_ID=Ov23lifeCftrdv4dcMBW
   GITHUB_CLIENT_SECRET=032fac07f2e7cc0a324d83de5fcebde228523fb3
   NEXTAUTH_SECRET=your_random_secret_here_minimum_32_chars
   NEXTAUTH_URL=http://localhost:3000
   ```
2. Generate NEXTAUTH_SECRET: `openssl rand -base64 32`
3. Restart dev server: `npm run dev`

**How to test `/test-oauth`**:
1. Visit `/test-oauth`
2. Click "Sign in with GitHub"
3. Authorize the OAuth app
4. Create credential from session
5. Verify VC creation works

## 🔧 Environment Setup Checklist

### Required Environment Variables
```bash
# GitHub API (for free testing)
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_your_token_here

# PersonaChain (already configured)
NEXT_PUBLIC_RPC_URL=http://161.35.2.88:26657
NEXT_PUBLIC_API_URL=https://persona-prod-alb-1378202633.us-east-1.elb.amazonaws.com

# Wallet Connect (already configured)
NEXT_PUBLIC_REOWN_PROJECT_ID=946b25b33d5bf1a42b32971e742ce05d
```

### Optional Environment Variables (for future testing)
```bash
# Stripe (for payment testing)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# DID Contract (when deployed)
NEXT_PUBLIC_DID_CONTRACT=contract_address_here
```

## 📋 Complete Flow Testing Priority

### Phase 1: Foundation (CURRENT)
- [x] **DID Creation** (we have this working)
- [x] **DID Login Flow** (`/test-did-login`)
- [x] **GitHub API Integration** (`/test-github`)
- [x] **GitHub OAuth Integration** (`/test-oauth`)
- [ ] **Test both GitHub flows with real credentials**

### Phase 2: Verification (NEXT)
- [ ] **VC Creation & Storage** (from GitHub test)
- [ ] **ZK Proof Generation** (from VC)
- [ ] **Proof Presentation** (shareable ZKP)

### Phase 3: End-to-End (FINAL)
- [ ] **Complete Flow**: DID → GitHub → VC → ZKP → Share
- [ ] **Add More Verification Types** (Government, Educational, etc.)

## 🚦 Current Status

**✅ Ready to Test:**
- DID wallet recognition
- GitHub API integration (with personal token)
- GitHub OAuth authentication (production flow)
- VC creation from both GitHub flows

**🔄 Needs Setup:**
- GitHub Personal Access Token for `/test-github` (5 minutes)
- NextAuth secret generation for `/test-oauth` (2 minutes)
- Test with real GitHub usernames and OAuth flow

**⏳ Next Steps:**
- ZK proof generation from VC
- Proof sharing and presentation
- Complete end-to-end testing

## 🎯 How to Test RIGHT NOW

**Immediate Testing (5 minutes):**

1. **Test DID Login**:
   ```bash
   # Visit in browser
   http://localhost:3000/test-did-login
   ```

2. **Setup GitHub API**:
   ```bash
   # Get token from: https://github.com/settings/tokens
   # Add to .env.local
   echo "GITHUB_PERSONAL_ACCESS_TOKEN=your_token_here" >> .env.local
   npm run dev
   ```

3. **Test GitHub API Verification**:
   ```bash
   # Visit in browser
   http://localhost:3000/test-github
   # Try username: octocat
   ```

4. **Test GitHub OAuth Flow**:
   ```bash
   # Generate NextAuth secret first
   openssl rand -base64 32
   # Add to .env.local as NEXTAUTH_SECRET
   # Visit in browser
   http://localhost:3000/test-oauth
   ```

**Expected Results:**
- DID test shows wallet connection and routing logic
- GitHub API test creates a complete Verifiable Credential from username
- GitHub OAuth test authenticates user and creates VC from session
- All steps should complete successfully for both GitHub flows

## 🐛 Common Issues & Solutions

### Issue: "GitHub API token not configured"
**Solution**: Add GITHUB_PERSONAL_ACCESS_TOKEN to .env.local

### Issue: "No wallet connected"  
**Solution**: Install and connect Keplr wallet extension

### Issue: "DID contract not found"
**Solution**: Expected - DID contract not deployed yet, test shows routing logic

### Issue: Rate limit exceeded
**Solution**: GitHub token allows 5000 requests/hour, much higher than testing needs

## 📊 Success Criteria

**For DID Login Test:**
- ✅ Wallet detected correctly
- ✅ Appropriate routing decision made
- ✅ Clean error handling

**For GitHub API Test:**
- ✅ API connection successful
- ✅ Profile data fetched correctly  
- ✅ Developer level determined
- ✅ Verifiable Credential created with proper structure
- ✅ All 5 test steps complete

**For GitHub OAuth Test:**
- ✅ OAuth authentication successful
- ✅ Session data available
- ✅ VC created from session
- ✅ Production flow works end-to-end

**Ready for Next Phase When:**
- All three tests pass completely (DID + GitHub API + GitHub OAuth)
- GitHub VCs have proper structure from both flows
- OAuth session management works correctly
- No critical errors in console

---

🎉 **Once these tests pass, we have a complete verification system foundation!** We can then build ZK proofs and sharing on top of this solid base.