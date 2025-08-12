// PersonaPass Shopify App - Age Verification Made Simple

import { createServer } from 'http';
import express from 'express';
import { Shopify, ApiVersion } from '@shopify/shopify-api';
import { PersonaPass } from '@personapass/verify';

// Initialize Shopify
const shopify = new Shopify({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET,
  scopes: ['write_script_tags', 'read_products', 'write_checkout'],
  hostName: process.env.SHOPIFY_APP_URL,
  apiVersion: ApiVersion.January24,
});

// Initialize PersonaPass
const personapass = new PersonaPass({
  apiKey: process.env.PERSONAPASS_API_KEY,
  environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox'
});

const app = express();
app.use(express.json());

// OAuth flow
app.get('/auth', async (req, res) => {
  const authRoute = await shopify.auth.begin({
    shop: req.query.shop,
    callbackPath: '/auth/callback',
    isOnline: false,
  });
  res.redirect(authRoute);
});

app.get('/auth/callback', async (req, res) => {
  try {
    const session = await shopify.auth.validateAuthCallback(
      req,
      res,
      req.query
    );
    
    // Store merchant info
    await storeMerchantSession(session);
    
    // Install app script tag
    await installScriptTag(session);
    
    res.redirect(`/app?shop=${session.shop}`);
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).send('Authentication failed');
  }
});

// Main app page
app.get('/app', async (req, res) => {
  const shop = req.query.shop;
  const merchantData = await getMerchantData(shop);
  
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>PersonaPass Age Verification</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <link rel="stylesheet" href="https://unpkg.com/@shopify/polaris@11.0.0/build/esm/styles.css">
    </head>
    <body>
      <div id="app">
        <div style="max-width: 800px; margin: 0 auto; padding: 20px;">
          <h1>PersonaPass Age Verification</h1>
          
          <div style="background: #f4f6f8; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2>📊 Your Stats</h2>
            <p>Total Verifications: <strong>${merchantData?.stats?.total || 0}</strong></p>
            <p>This Month: <strong>${merchantData?.stats?.monthly || 0}</strong></p>
            <p>Success Rate: <strong>${merchantData?.stats?.successRate || 98.5}%</strong></p>
          </div>
          
          <div style="background: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 8px; margin: 20px 0;">
            <h2>⚙️ Configuration</h2>
            <form id="config-form">
              <div style="margin-bottom: 15px;">
                <label>Minimum Age Required:</label><br>
                <select id="minimum-age" style="width: 200px; padding: 8px;">
                  <option value="18">18+</option>
                  <option value="21" selected>21+</option>
                  <option value="25">25+</option>
                </select>
              </div>
              
              <div style="margin-bottom: 15px;">
                <label>Enable for:</label><br>
                <label><input type="checkbox" checked> All products</label><br>
                <label><input type="checkbox"> Specific collections only</label>
              </div>
              
              <div style="margin-bottom: 15px;">
                <label>Redirect after verification:</label><br>
                <input type="text" placeholder="/products" value="/" style="width: 300px; padding: 8px;">
              </div>
              
              <button type="submit" style="background: #5c6ac4; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer;">
                Save Configuration
              </button>
            </form>
          </div>
          
          <div style="background: #e3f5e3; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2>💰 Pricing</h2>
            <p><strong>$0.05</strong> per successful verification</p>
            <p>95% cheaper than traditional KYC!</p>
            <p><a href="https://app.personapass.xyz/merchant/billing" target="_blank">View detailed billing →</a></p>
          </div>
          
          <div style="background: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 8px; margin: 20px 0;">
            <h2>🚀 How It Works</h2>
            <ol>
              <li>Customer visits age-restricted product</li>
              <li>PersonaPass age gate appears</li>
              <li>Customer verifies age with one click (no documents!)</li>
              <li>Verified customers proceed to checkout</li>
              <li>You're charged $0.05 per verification</li>
            </ol>
          </div>
          
          <div style="text-align: center; margin-top: 40px; color: #666;">
            <p>Need help? Contact support@personapass.xyz</p>
            <p>PersonaPass - Your Identity, Your Control 🔐</p>
          </div>
        </div>
      </div>
      
      <script>
        document.getElementById('config-form').addEventListener('submit', async (e) => {
          e.preventDefault();
          
          const config = {
            minimumAge: document.getElementById('minimum-age').value,
            // Add other config options
          };
          
          const response = await fetch('/app/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ shop: '${shop}', config })
          });
          
          if (response.ok) {
            alert('Configuration saved!');
          }
        });
      </script>
    </body>
    </html>
  `);
});

// Save configuration
app.post('/app/config', async (req, res) => {
  const { shop, config } = req.body;
  await saveMerchantConfig(shop, config);
  res.json({ success: true });
});

// Webhook handlers
app.post('/api/webhooks', async (req, res) => {
  const { topic, shop, domain } = req.headers;
  
  switch(topic) {
    case 'app/uninstalled':
      await handleAppUninstalled(shop);
      break;
    case 'shop/update':
      await handleShopUpdate(shop, req.body);
      break;
  }
  
  res.status(200).send('OK');
});

// Proxy endpoint for frontend verification
app.get('/proxy/verify', async (req, res) => {
  const { shop, minimum_age } = req.query;
  
  // Create PersonaPass verification session
  const session = await personapass.verifyAge({
    minimumAge: parseInt(minimum_age) || 21,
    redirectUrl: `https://${shop}/account`,
    metadata: {
      shop,
      source: 'shopify',
      webhook_url: `${process.env.SHOPIFY_APP_URL}/webhooks/verification`
    }
  });
  
  res.json({
    verificationUrl: session.verificationUrl,
    sessionId: session.id
  });
});

// Handle PersonaPass verification webhook
app.post('/webhooks/verification', async (req, res) => {
  const { event, data } = req.body;
  
  if (event === 'verification.completed' && data.verified) {
    const shop = data.metadata.shop;
    
    // Record successful verification
    await recordVerification(shop, data);
    
    // You could set a cookie or session here
    // to remember verified users
  }
  
  res.status(200).send('OK');
});

// Helper functions
async function installScriptTag(session) {
  const client = new shopify.clients.Rest({ session });
  
  // Install age gate script
  await client.post({
    path: 'script_tags',
    data: {
      script_tag: {
        event: 'onload',
        src: 'https://cdn.personapass.xyz/shopify-age-gate.js'
      }
    }
  });
}

async function storeMerchantSession(session) {
  // Store in database
  console.log('Storing merchant session:', session.shop);
}

async function getMerchantData(shop) {
  // Get from database
  return {
    shop,
    stats: {
      total: 156,
      monthly: 42,
      successRate: 98.5
    }
  };
}

async function saveMerchantConfig(shop, config) {
  console.log('Saving config for', shop, config);
  // Save to database
}

async function handleAppUninstalled(shop) {
  console.log('App uninstalled:', shop);
  // Clean up merchant data
}

async function handleShopUpdate(shop, data) {
  console.log('Shop updated:', shop);
  // Update merchant info
}

async function recordVerification(shop, data) {
  console.log('Recording verification for', shop);
  // Track in database
}

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`PersonaPass Shopify app running on port ${PORT}`);
});