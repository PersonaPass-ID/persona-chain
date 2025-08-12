# 🌩️ Cloudflare DNS Automation Setup

## 🎯 **Automated DNS Configuration via Terraform**

I've set up Terraform to automatically configure the Cloudflare DNS record! Here's how to complete it:

---

## 🔑 **Step 1: Get Cloudflare API Credentials**

### **Option A: API Token (Recommended)**

1. **Go to**: https://dash.cloudflare.com/profile/api-tokens
2. **Click**: "Create Token"
3. **Use**: "Edit zone DNS" template
4. **Configure**:
   - Permissions: `Zone:DNS:Edit`
   - Zone Resources: `Include - Specific zone - personapass.xyz`
5. **Create** and copy the token

### **Option B: Global API Key (Alternative)**

1. **Go to**: https://dash.cloudflare.com/profile/api-tokens
2. **View**: "Global API Key"
3. **Copy** the key + your email

---

## 🔧 **Step 2: Set Environment Variables**

### **For API Token:**
```bash
export CLOUDFLARE_API_TOKEN="your_api_token_here"
```

### **For Global API Key:**
```bash
export CLOUDFLARE_EMAIL="your_cloudflare_email@domain.com"
export CLOUDFLARE_API_KEY="your_global_api_key_here"
```

---

## 🚀 **Step 3: Deploy DNS Configuration**

Run these commands to automatically create the DNS record:

```bash
cd /home/rocz/persona-hq/workspaces/persona-frontend/persona-wallet/terraform/

# Initialize Cloudflare provider
terraform init

# Plan the DNS changes
terraform plan

# Apply the DNS configuration
terraform apply -auto-approve
```

---

## ✅ **Expected Result**

After running the Terraform commands, you'll get:

```
Apply complete! Resources: 1 added, 0 changed, 0 destroyed.

Outputs:

cloudflare_wallet_record = {
  "name" = "wallet.personapass.xyz"
  "proxied" = true
  "type" = "CNAME"  
  "value" = "wallet-personapass-xyz.s3-website-us-east-1.amazonaws.com"
}

wallet_url = "https://wallet.personapass.xyz"
```

**Then test:**
```bash
curl -I https://wallet.personapass.xyz
# Should return: server: cloudflare
```

---

## 🔄 **Alternative: Manual Quick Setup**

If you prefer to do it manually in the Cloudflare dashboard:

1. **Login**: https://dash.cloudflare.com
2. **Select**: personapass.xyz 
3. **DNS** > Records > **Add record**
4. **Configure**:
   - Type: `CNAME`
   - Name: `wallet`
   - Target: `wallet-personapass-xyz.s3-website-us-east-1.amazonaws.com`
   - Proxy status: `🟠 Proxied` (orange cloud)
5. **Save**

---

## 🧪 **Testing Commands**

After DNS setup (2-5 minutes), verify with:

```bash
# Test DNS resolution
dig wallet.personapass.xyz

# Test HTTPS access
curl -I https://wallet.personapass.xyz

# Check for Cloudflare headers
curl -I https://wallet.personapass.xyz | grep -i "server:\|cf-ray"

# Test PersonaWallet content
curl -s https://wallet.personapass.xyz | grep "PersonaWallet"
```

---

## 📋 **What This Terraform Config Does**

1. **Connects** to your Cloudflare account
2. **Finds** the personapass.xyz zone
3. **Creates** a CNAME record: `wallet.personapass.xyz` → S3 website endpoint  
4. **Enables** Cloudflare proxy (orange cloud) for CDN + SSL
5. **Outputs** the record details for verification

---

## 🎯 **Files Created**

- `terraform/cloudflare-dns.tf` - Terraform configuration for DNS
- `CLOUDFLARE_AUTOMATION.md` - This setup guide

---

**Once you set the environment variable and run `terraform apply`, the DNS will be configured automatically! 🚀**

**PersonaWallet will be live at https://wallet.personapass.xyz in minutes!** 🌟