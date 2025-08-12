# PersonaPass Merchant SDK

The official JavaScript SDK for PersonaPass - privacy-preserving age verification that's 95% cheaper than traditional KYC.

## Why PersonaPass?

- **95% Cost Reduction**: $0.05 per verification vs $2+ for competitors
- **Privacy First**: Zero personal data storage (ZK proofs)
- **Instant Integration**: One line of code
- **No User Friction**: 1-click verification in <2 seconds

## Installation

```bash
npm install @personapass/verify
# or
yarn add @personapass/verify
```

## Quick Start

```javascript
import { PersonaPass } from '@personapass/verify';

const personapass = new PersonaPass({
  apiKey: 'pk_live_YOUR_API_KEY',
  environment: 'production'
});

// Create age verification session
const session = await personapass.verifyAge({
  minimumAge: 21,
  redirectUrl: 'https://yourstore.com/verified'
});

// Redirect user to verification
window.location.href = session.verificationUrl;
```

## React Integration

```jsx
import { usePersonaPass } from '@personapass/verify';

function AgeGate() {
  const { verifyAge } = usePersonaPass({
    apiKey: process.env.NEXT_PUBLIC_PERSONAPASS_KEY
  });

  const handleVerify = async () => {
    const session = await verifyAge({ minimumAge: 21 });
    window.location.href = session.verificationUrl;
  };

  return (
    <button onClick={handleVerify}>
      Verify Age with PersonaPass
    </button>
  );
}
```

## Webhook Handling

```javascript
// Handle verification completion
app.post('/webhooks/personapass', (req, res) => {
  const signature = req.headers['x-personapass-signature'];
  
  if (!personapass.verifyWebhookSignature(req.body, signature)) {
    return res.status(401).send('Invalid signature');
  }

  const { event, data } = req.body;
  
  if (event === 'verification.completed') {
    // Grant access to age-restricted content
    console.log('User verified:', data.sessionId);
  }
  
  res.status(200).send('OK');
});
```

## Shopify Integration

```liquid
<!-- Add to your theme's age-gate.liquid -->
{% if shop.metafields.personapass.enabled %}
  <script src="https://cdn.personapass.xyz/v1/verify.js"></script>
  <script>
    PersonaPass.init({
      apiKey: '{{ shop.metafields.personapass.api_key }}',
      minimumAge: 21,
      onSuccess: function() {
        // Allow access to store
        window.location.href = '/';
      }
    });
  </script>
{% endif %}
```

## API Reference

### `new PersonaPass(config)`

Create a new PersonaPass client.

**Parameters:**
- `apiKey` (string, required): Your PersonaPass API key
- `environment` (string, optional): 'production' or 'sandbox'
- `baseUrl` (string, optional): Custom API endpoint

### `verifyAge(options)`

Create an age verification session.

**Parameters:**
- `minimumAge` (number, required): Minimum age requirement
- `redirectUrl` (string, optional): URL to redirect after verification
- `metadata` (object, optional): Custom metadata

**Returns:** `VerificationSession` object

### `checkVerification(sessionId)`

Check the status of a verification session.

**Parameters:**
- `sessionId` (string, required): The session ID to check

**Returns:** `VerificationResult` object

## Pricing

- **Starter**: $0/month + $0.05 per verification
- **Growth**: $500/month for unlimited verifications
- **Enterprise**: Custom pricing for high volume

## Support

- Documentation: https://docs.personapass.xyz
- Email: support@personapass.xyz
- Discord: https://discord.gg/personapass

## License

MIT