// PersonaPass Shopify Age Gate Script
// Automatically adds age verification to your store

(function() {
  'use strict';
  
  // Configuration (loaded from merchant settings)
  const PERSONAPASS_CONFIG = window.PERSONAPASS_CONFIG || {
    minimumAge: 21,
    enabled: true,
    restrictedProducts: 'all', // 'all' or array of product IDs
    style: 'modal' // 'modal' or 'redirect'
  };
  
  // Check if we're on a product page that needs age verification
  function shouldShowAgeGate() {
    // Skip if already verified
    if (getCookie('personapass_verified') === 'true') {
      return false;
    }
    
    // Check if on product page
    if (!window.location.pathname.includes('/products/')) {
      return false;
    }
    
    // Check if product is restricted
    if (PERSONAPASS_CONFIG.restrictedProducts === 'all') {
      return true;
    }
    
    // Check specific products
    const productId = getProductId();
    return PERSONAPASS_CONFIG.restrictedProducts.includes(productId);
  }
  
  // Create age gate modal
  function createAgeGateModal() {
    const modal = document.createElement('div');
    modal.id = 'personapass-age-gate';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    
    modal.innerHTML = `
      <div style="
        background: white;
        border-radius: 12px;
        padding: 40px;
        max-width: 480px;
        width: 90%;
        text-align: center;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
      ">
        <div style="margin-bottom: 20px;">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" style="margin: 0 auto;">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" fill="#4F46E5"/>
            <path d="M12 11.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" fill="#6366F1"/>
          </svg>
        </div>
        
        <h2 style="
          font-size: 28px;
          margin-bottom: 16px;
          color: #111827;
          font-weight: 700;
        ">Age Verification Required</h2>
        
        <p style="
          font-size: 18px;
          color: #6B7280;
          margin-bottom: 32px;
          line-height: 1.5;
        ">
          You must be <strong>${PERSONAPASS_CONFIG.minimumAge}+</strong> years old to view this product.
        </p>
        
        <button id="personapass-verify-btn" style="
          background: #4F46E5;
          color: white;
          border: none;
          padding: 16px 32px;
          font-size: 18px;
          font-weight: 600;
          border-radius: 8px;
          cursor: pointer;
          width: 100%;
          margin-bottom: 16px;
          transition: background 0.2s;
        " onmouseover="this.style.background='#4338CA'" onmouseout="this.style.background='#4F46E5'">
          🔐 Verify My Age
        </button>
        
        <p style="
          font-size: 14px;
          color: #9CA3AF;
          margin-bottom: 0;
        ">
          One-click verification • No documents required • 100% private
        </p>
        
        <div style="
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid #E5E7EB;
        ">
          <a href="/" style="
            color: #6B7280;
            text-decoration: none;
            font-size: 14px;
          ">← Return to Homepage</a>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add click handler
    document.getElementById('personapass-verify-btn').addEventListener('click', startVerification);
  }
  
  // Start PersonaPass verification
  async function startVerification() {
    const button = document.getElementById('personapass-verify-btn');
    button.disabled = true;
    button.innerHTML = '🔄 Loading...';
    
    try {
      // Get shop domain
      const shop = window.Shopify?.shop || window.location.hostname;
      
      // Create verification session
      const response = await fetch(`/apps/personapass/verify?shop=${shop}&minimum_age=${PERSONAPASS_CONFIG.minimumAge}`);
      const data = await response.json();
      
      if (data.verificationUrl) {
        // Redirect to PersonaPass
        window.location.href = data.verificationUrl;
      } else {
        throw new Error('Failed to create verification session');
      }
    } catch (error) {
      console.error('PersonaPass Error:', error);
      button.disabled = false;
      button.innerHTML = '🔐 Verify My Age';
      alert('Verification service temporarily unavailable. Please try again.');
    }
  }
  
  // Utility functions
  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
  }
  
  function setCookie(name, value, days) {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
  }
  
  function getProductId() {
    // Extract product ID from URL or page data
    if (window.ShopifyAnalytics?.meta?.product?.id) {
      return window.ShopifyAnalytics.meta.product.id;
    }
    
    // Try meta tags
    const metaTag = document.querySelector('meta[property="og:product:id"]');
    if (metaTag) {
      return metaTag.content;
    }
    
    // Extract from URL
    const match = window.location.pathname.match(/\/products\/([^\/]+)/);
    return match ? match[1] : null;
  }
  
  // Check for verification callback
  function checkVerificationCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('personapass_verified') === 'true') {
      // Set verification cookie
      setCookie('personapass_verified', 'true', 30); // Valid for 30 days
      
      // Clean up URL
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
      
      // Show success message
      showSuccessMessage();
    }
  }
  
  function showSuccessMessage() {
    const message = document.createElement('div');
    message.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10B981;
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 999999;
      animation: slideIn 0.3s ease-out;
    `;
    message.innerHTML = '✅ Age Verified Successfully!';
    
    document.body.appendChild(message);
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    
    // Remove after 3 seconds
    setTimeout(() => {
      message.style.opacity = '0';
      message.style.transform = 'translateX(100%)';
      setTimeout(() => message.remove(), 300);
    }, 3000);
  }
  
  // Initialize
  function init() {
    // Check for verification callback first
    checkVerificationCallback();
    
    // Then check if age gate is needed
    if (shouldShowAgeGate()) {
      createAgeGateModal();
    }
  }
  
  // Wait for DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  // Also listen for Shopify navigation (for SPAs)
  if (window.Shopify?.designMode === false) {
    document.addEventListener('page:load', init);
  }
  
  // Export for debugging
  window.PersonaPassAgeGate = {
    config: PERSONAPASS_CONFIG,
    showGate: createAgeGateModal,
    verify: startVerification
  };
})();