# Cloudflare DNS Configuration for PersonaPass.xyz
# This requires Cloudflare API credentials to be set

terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

# Configure Cloudflare provider
provider "cloudflare" {
  # These should be set as environment variables:
  # CLOUDFLARE_API_TOKEN or CLOUDFLARE_EMAIL + CLOUDFLARE_API_KEY
}

# Get the personapass.xyz zone
data "cloudflare_zone" "personapass" {
  name = "personapass.xyz"
}

# Create wallet.personapass.xyz DNS record
resource "cloudflare_record" "wallet" {
  zone_id = data.cloudflare_zone.personapass.id
  name    = "wallet"
  value   = aws_s3_bucket_website_configuration.wallet_website.website_endpoint
  type    = "CNAME"
  proxied = true
  ttl     = 1 # Auto TTL when proxied

  comment = "PersonaWallet S3 website endpoint via Cloudflare CDN"
}

# Output the DNS record info
output "cloudflare_wallet_record" {
  description = "Cloudflare DNS record for PersonaWallet"
  value = {
    name     = cloudflare_record.wallet.hostname
    type     = cloudflare_record.wallet.type
    value    = cloudflare_record.wallet.value
    proxied  = cloudflare_record.wallet.proxied
  }
}