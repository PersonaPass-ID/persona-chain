import React, { useState } from 'react';
import {
  Banner,
  Button,
  BlockStack,
  Text,
  useApi,
  useSettings,
  useMetafield,
  reactExtension,
} from '@shopify/ui-extensions-react/checkout';

// PersonaPass Checkout Age Verification Extension
export default reactExtension('purchase.checkout.block.render', () => <AgeGate />);

function AgeGate() {
  const { extension } = useApi();
  const settings = useSettings();
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  
  // Check if already verified
  const verifiedMetafield = useMetafield({
    namespace: 'personapass',
    key: 'verified'
  });
  
  // Don't show if already verified or disabled
  if (verifiedMetafield?.value === 'true' || !settings.enabled || verified) {
    return null;
  }
  
  const handleVerification = async () => {
    setLoading(true);
    
    try {
      // Get shop domain
      const shop = extension.shop.myshopifyDomain;
      
      // Create verification session
      const response = await fetch(`https://app.personapass.xyz/api/shopify/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shop,
          minimumAge: settings.minimum_age || 21,
          checkoutToken: extension.sessionToken
        })
      });
      
      const data = await response.json();
      
      if (data.verificationUrl) {
        // Open PersonaPass in new window
        window.open(data.verificationUrl, 'personapass', 'width=400,height=600');
        
        // Poll for verification status
        const checkInterval = setInterval(async () => {
          const statusResponse = await fetch(
            `https://app.personapass.xyz/api/shopify/verify/status/${data.sessionId}`
          );
          const status = await statusResponse.json();
          
          if (status.verified) {
            clearInterval(checkInterval);
            setVerified(true);
            setLoading(false);
            
            // Update metafield
            extension.metafields.update({
              namespace: 'personapass',
              key: 'verified',
              value: 'true',
              type: 'boolean'
            });
          }
        }, 2000);
        
        // Stop checking after 5 minutes
        setTimeout(() => {
          clearInterval(checkInterval);
          setLoading(false);
        }, 300000);
      }
    } catch (error) {
      console.error('PersonaPass error:', error);
      setLoading(false);
    }
  };
  
  return (
    <BlockStack spacing="base">
      <Banner status="warning">
        <BlockStack spacing="tight">
          <Text size="medium" emphasis="bold">
            Age Verification Required
          </Text>
          <Text size="base">
            You must be {settings.minimum_age || 21}+ years old to complete this purchase.
          </Text>
        </BlockStack>
      </Banner>
      
      <Button
        onPress={handleVerification}
        disabled={loading}
        loading={loading}
        accessibilityLabel="Verify your age"
      >
        {loading ? 'Verifying...' : '🔐 Verify My Age'}
      </Button>
      
      <Text size="small" appearance="subdued">
        Powered by PersonaPass • No documents required • 100% private
      </Text>
    </BlockStack>
  );
}