# PersonaPass Merchant FAQ

## 🚀 Getting Started

### What is PersonaPass?
PersonaPass is a privacy-preserving age verification service that allows customers to prove they're over a certain age without uploading IDs or sharing personal information. Using zero-knowledge proofs, we verify age in under 2 seconds for just $0.05 per verification.

### How does it work?
1. Customer clicks "Verify Age" on your site
2. They connect their digital wallet (MetaMask, Rainbow, etc.)
3. PersonaPass generates a zero-knowledge proof of their age
4. Verification completes in <2 seconds
5. Customer proceeds to checkout
6. You're charged $0.05 for the verification

### What makes PersonaPass different?
- **No ID uploads**: Customers never share personal documents
- **Instant verification**: <2 seconds vs 5+ minutes
- **95% cheaper**: $0.05 vs $2-5 per verification
- **Higher conversion**: 73% average vs 23% industry standard
- **Zero data storage**: We don't store any personal information
- **Easy integration**: 10 minutes to set up

---

## 💰 Pricing & Billing

### How much does PersonaPass cost?
- **Starter Plan**: $0/month + $0.05 per verification
- **Growth Plan**: $199/month + $0.03 per verification  
- **Enterprise**: Custom pricing for high volume

No setup fees, no hidden charges, cancel anytime.

### When am I charged?
You're only charged for successful verifications. Failed attempts, test mode, and demo verifications are free. Billing happens monthly via Stripe.

### Do you offer a free trial?
Yes! 14-day free trial with up to 100 verifications. No credit card required to start.

### What payment methods do you accept?
We accept all major credit cards, ACH transfers, and wire transfers (Enterprise only) through Stripe.

---

## 🔧 Integration & Technical

### How long does integration take?
- **Shopify**: 10 minutes (one-click app install)
- **JavaScript SDK**: 15 minutes  
- **REST API**: 30 minutes
- **Custom integration**: 1-2 hours

### What platforms do you support?
- Shopify (native app)
- WooCommerce
- BigCommerce  
- Magento
- Custom websites (via JS SDK or API)
- Mobile apps (iOS/Android SDKs)

### Do I need to change my checkout flow?
No! PersonaPass appears only when customers add age-restricted items to cart. Your regular products and checkout remain unchanged.

### Can I customize the appearance?
Yes! You can customize:
- Button text and colors
- Modal vs redirect style
- Logo and branding
- Success/error messages
- Language (15+ languages supported)

### Do customers need crypto/blockchain knowledge?
No! While we use blockchain technology behind the scenes, customers just see a simple "Verify Age" button. Most use email-based wallets that feel like regular login.

---

## 🛡️ Compliance & Security

### Is PersonaPass legally compliant?
Yes! PersonaPass meets or exceeds age verification requirements in:
- All 50 US states
- European Union (GDPR compliant)
- United Kingdom
- Canada
- Australia

We provide compliance documentation and audit logs for regulatory purposes.

### What about privacy laws?
PersonaPass is designed for privacy:
- **GDPR compliant**: No personal data stored
- **CCPA compliant**: Nothing to delete as we store nothing
- **COPPA compliant**: Designed for age verification
- **SOC 2 Type II certified**

### How do you prevent fraud?
- Cryptographic proofs cannot be forged
- One-person-one-wallet enforcement
- Machine learning fraud detection
- Rate limiting and abuse prevention
- Optional additional verification layers

### What data do you store?
We store:
- ✅ Verification timestamp
- ✅ Pass/fail result
- ✅ Your merchant ID
- ❌ No names
- ❌ No addresses  
- ❌ No birth dates
- ❌ No ID numbers
- ❌ No personal information

---

## 👥 Customer Experience

### What do customers see?
Customers see a simple "Verify Age" button. When clicked, they:
1. Connect their wallet (or create one with email)
2. Approve the age verification
3. Return to your site
4. Continue shopping

Total time: <2 seconds

### Do customers need a crypto wallet?
While we use wallet technology, customers don't need crypto knowledge. They can:
- Use email-based wallets (feels like regular login)
- Use existing wallets (MetaMask, Rainbow, etc.)
- Use social login wallets (coming soon)

### What if a customer fails verification?
They see a polite message explaining they don't meet age requirements. You can customize this message and redirect them to age-appropriate products.

### Is verification reusable?
Yes! Once verified, customers can shop at any PersonaPass merchant for 30 days without re-verifying. This creates a network effect benefiting all merchants.

---

## 📊 Analytics & Reporting

### What analytics do you provide?
Real-time dashboard showing:
- Verification count and success rate
- Conversion funnel metrics
- Revenue impact tracking
- Geographic distribution
- Device/browser breakdown
- Peak usage times
- Cost analysis

### Can I export data?
Yes! Export all data as:
- CSV files
- API access
- Webhook events
- Daily email reports
- Slack/Discord notifications

### Do you integrate with analytics tools?
Yes! We integrate with:
- Google Analytics 4
- Mixpanel
- Segment
- Amplitude
- Custom webhooks

---

## 🆘 Troubleshooting

### Common Issues & Solutions

**"Customers can't connect wallet"**
- Ensure they have a compatible wallet installed
- Try our email wallet option
- Check browser compatibility (Chrome, Firefox, Safari, Edge)

**"Verification failing"**
- Check internet connectivity
- Ensure cookies are enabled
- Try clearing cache
- Contact support for account review

**"Integration not working"**
- Verify API key is correct
- Check domain whitelist settings
- Ensure HTTPS is enabled
- Review browser console for errors

### How do I test the integration?
Use test mode:
- Test API key: `pk_test_xxxx`
- All verifications succeed
- No charges incurred
- Full analytics available

---

## 🤝 Support

### How do I get help?
- 📧 Email: support@personapass.xyz
- 💬 Live chat: Available 9am-6pm EST
- 📚 Docs: docs.personapass.xyz
- 🎮 Discord: discord.gg/personapass

### What's your SLA?
- **Starter**: Email support, 24-48 hour response
- **Growth**: Priority support, 4 hour response
- **Enterprise**: Dedicated support, 1 hour response, 99.9% uptime SLA

### Do you offer onboarding help?
- **Starter**: Self-service + documentation
- **Growth**: 30-minute onboarding call
- **Enterprise**: White-glove setup and training

---

## 🚀 Growth & Optimization

### How can I improve conversion rates?
1. **Messaging**: Emphasize "no ID upload needed"
2. **Placement**: Show trust badges near verify button
3. **Timing**: Verify at cart, not product page
4. **Incentives**: Offer first-time verification discount
5. **Education**: Add "How it works" link

### Best practices from top merchants:
- Use "Verify age in 1 click" as button text
- Show "No ID required" prominently  
- Add trust badges and security symbols
- Mention "Private & secure" in messaging
- Offer instant discount after verification

### Can PersonaPass help increase AOV?
Yes! Verified customers:
- Have 23% higher average order value
- Return 2.1x more often
- Are more likely to buy premium products
- Trust your store more

---

## 🔮 Future & Roadmap

### What's coming next?
- **Q1 2024**: Biometric verification option
- **Q2 2024**: Social login wallets
- **Q3 2024**: Mobile SDK improvements
- **Q4 2024**: AI fraud prevention v2

### Can I request features?
Yes! We love merchant feedback. Submit requests via:
- Dashboard feedback widget
- Email product@personapass.xyz
- Monthly merchant calls
- Discord community

### How often do you update?
- Weekly platform updates
- Monthly feature releases
- Quarterly major versions
- Daily security patches

---

## 💡 Still have questions?

Contact us at support@personapass.xyz or join our Discord community where 1,000+ merchants share tips and best practices.

**Ready to start?** Sign up at [personapass.xyz/merchant/onboard](https://personapass.xyz/merchant/onboard)