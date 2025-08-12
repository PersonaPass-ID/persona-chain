// PersonaPass Analytics Tracking
// Comprehensive event tracking for conversion optimization

import mixpanel from 'mixpanel-browser';
import { v4 as uuidv4 } from 'uuid';

// Event types for tracking
export enum AnalyticsEvent {
  // Page Views
  PAGE_VIEW = 'page_view',
  DEMO_VIEW = 'demo_view',
  LANDING_VIEW = 'landing_view',
  
  // Merchant Events
  MERCHANT_SIGNUP_START = 'merchant_signup_start',
  MERCHANT_SIGNUP_COMPLETE = 'merchant_signup_complete',
  MERCHANT_API_KEY_CREATED = 'merchant_api_key_created',
  MERCHANT_PAYMENT_ADDED = 'merchant_payment_added',
  MERCHANT_FIRST_VERIFICATION = 'merchant_first_verification',
  
  // Verification Events
  VERIFICATION_STARTED = 'verification_started',
  VERIFICATION_WALLET_CONNECTED = 'verification_wallet_connected',
  VERIFICATION_COMPLETED = 'verification_completed',
  VERIFICATION_FAILED = 'verification_failed',
  VERIFICATION_ABANDONED = 'verification_abandoned',
  
  // Demo Events
  DEMO_PRODUCT_CLICKED = 'demo_product_clicked',
  DEMO_AGE_GATE_SHOWN = 'demo_age_gate_shown',
  DEMO_VERIFICATION_STARTED = 'demo_verification_started',
  DEMO_VERIFICATION_COMPLETED = 'demo_verification_completed',
  DEMO_STATS_VIEWED = 'demo_stats_viewed',
  
  // Conversion Events
  CTA_CLICKED = 'cta_clicked',
  PRICING_VIEWED = 'pricing_viewed',
  FREE_TRIAL_STARTED = 'free_trial_started',
  PLAN_UPGRADED = 'plan_upgraded',
  
  // Integration Events
  SDK_DOWNLOADED = 'sdk_downloaded',
  API_KEY_COPIED = 'api_key_copied',
  SHOPIFY_APP_INSTALLED = 'shopify_app_installed',
  DOCUMENTATION_VIEWED = 'documentation_viewed',
  
  // Revenue Events
  REVENUE_GENERATED = 'revenue_generated',
  SUBSCRIPTION_CREATED = 'subscription_created',
  SUBSCRIPTION_CANCELLED = 'subscription_cancelled'
}

// User properties to track
interface UserProperties {
  merchantId?: string;
  email?: string;
  company?: string;
  plan?: 'starter' | 'growth' | 'enterprise';
  monthlyVerifications?: number;
  industry?: string;
  integrationMethod?: 'shopify' | 'sdk' | 'api';
  signupDate?: string;
  lifetimeValue?: number;
}

// Event properties
interface EventProperties {
  page?: string;
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  value?: number;
  currency?: string;
  productId?: string;
  errorMessage?: string;
  duration?: number;
  success?: boolean;
  method?: string;
  [key: string]: any;
}

class AnalyticsTracker {
  private initialized = false;
  private sessionId: string;
  private userId: string | null = null;

  constructor() {
    this.sessionId = uuidv4();
    this.initialize();
  }

  private initialize() {
    if (this.initialized) return;

    // Initialize Mixpanel
    if (process.env.NEXT_PUBLIC_MIXPANEL_TOKEN) {
      mixpanel.init(process.env.NEXT_PUBLIC_MIXPANEL_TOKEN, {
        debug: process.env.NODE_ENV === 'development',
        track_pageview: false,
        persistence: 'localStorage',
        api_host: 'https://api.mixpanel.com'
      });
      this.initialized = true;
    }

    // Initialize Google Analytics
    if (process.env.NEXT_PUBLIC_GA_ID && typeof window !== 'undefined') {
      const script = document.createElement('script');
      script.src = `https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`;
      script.async = true;
      document.head.appendChild(script);

      window.dataLayer = window.dataLayer || [];
      function gtag(...args: any[]) {
        window.dataLayer.push(args);
      }
      gtag('js', new Date());
      gtag('config', process.env.NEXT_PUBLIC_GA_ID);
    }

    // Track initial page view
    this.track(AnalyticsEvent.PAGE_VIEW, {
      page: window.location.pathname,
      referrer: document.referrer
    });
  }

  // Set user ID for authenticated tracking
  public identify(userId: string, properties?: UserProperties) {
    this.userId = userId;
    
    if (this.initialized && mixpanel) {
      mixpanel.identify(userId);
      if (properties) {
        mixpanel.people.set(properties);
      }
    }

    // Google Analytics user ID
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('set', { user_id: userId });
    }
  }

  // Track events
  public track(event: AnalyticsEvent, properties?: EventProperties) {
    const enrichedProperties = {
      ...properties,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      page: window.location.pathname,
      userAgent: navigator.userAgent,
      ...this.getUTMParams()
    };

    // Send to Mixpanel
    if (this.initialized && mixpanel) {
      mixpanel.track(event, enrichedProperties);
    }

    // Send to Google Analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', event, {
        ...enrichedProperties,
        event_category: this.getEventCategory(event),
        event_label: properties?.method || properties?.page
      });
    }

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Analytics Event:', event, enrichedProperties);
    }
  }

  // Track revenue
  public trackRevenue(amount: number, properties?: EventProperties) {
    this.track(AnalyticsEvent.REVENUE_GENERATED, {
      ...properties,
      value: amount,
      currency: 'USD'
    });

    if (this.initialized && mixpanel) {
      mixpanel.people.track_charge(amount, properties);
    }
  }

  // Track page views
  public trackPageView(page?: string) {
    this.track(AnalyticsEvent.PAGE_VIEW, {
      page: page || window.location.pathname,
      title: document.title
    });
  }

  // Track conversion funnel
  public trackConversionStep(step: string, properties?: EventProperties) {
    if (this.initialized && mixpanel) {
      mixpanel.track('Conversion Funnel', {
        step,
        ...properties
      });
    }
  }

  // Set user properties
  public setUserProperties(properties: UserProperties) {
    if (this.initialized && mixpanel) {
      mixpanel.people.set(properties);
    }
  }

  // Track timing
  public trackTiming(category: string, variable: string, time: number) {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'timing_complete', {
        event_category: category,
        name: variable,
        value: time
      });
    }
  }

  // Get UTM parameters
  private getUTMParams(): Record<string, string> {
    const params = new URLSearchParams(window.location.search);
    const utm: Record<string, string> = {};
    
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(param => {
      const value = params.get(param);
      if (value) utm[param] = value;
    });
    
    return utm;
  }

  // Get event category for GA
  private getEventCategory(event: AnalyticsEvent): string {
    if (event.includes('merchant')) return 'Merchant';
    if (event.includes('verification')) return 'Verification';
    if (event.includes('demo')) return 'Demo';
    if (event.includes('revenue')) return 'Revenue';
    return 'General';
  }
}

// Export singleton instance
export const analytics = new AnalyticsTracker();

// Helper functions for common tracking patterns
export const trackVerification = {
  start: (minimumAge: number) => {
    analytics.track(AnalyticsEvent.VERIFICATION_STARTED, { minimumAge });
  },
  
  walletConnected: (walletType: string) => {
    analytics.track(AnalyticsEvent.VERIFICATION_WALLET_CONNECTED, { walletType });
  },
  
  complete: (duration: number) => {
    analytics.track(AnalyticsEvent.VERIFICATION_COMPLETED, { 
      duration, 
      success: true 
    });
    analytics.trackRevenue(0.05); // $0.05 per verification
  },
  
  failed: (error: string) => {
    analytics.track(AnalyticsEvent.VERIFICATION_FAILED, { 
      errorMessage: error,
      success: false 
    });
  },
  
  abandoned: (stage: string) => {
    analytics.track(AnalyticsEvent.VERIFICATION_ABANDONED, { stage });
  }
};

export const trackMerchant = {
  signupStart: (source?: string) => {
    analytics.track(AnalyticsEvent.MERCHANT_SIGNUP_START, { source });
  },
  
  signupComplete: (company: string, email: string) => {
    analytics.track(AnalyticsEvent.MERCHANT_SIGNUP_COMPLETE, { company });
    analytics.trackConversionStep('signup_complete', { company });
  },
  
  apiKeyCreated: () => {
    analytics.track(AnalyticsEvent.MERCHANT_API_KEY_CREATED);
  },
  
  paymentAdded: (plan: string) => {
    analytics.track(AnalyticsEvent.MERCHANT_PAYMENT_ADDED, { plan });
    analytics.trackConversionStep('payment_added', { plan });
  },
  
  firstVerification: (merchantId: string) => {
    analytics.track(AnalyticsEvent.MERCHANT_FIRST_VERIFICATION, { merchantId });
    analytics.setUserProperties({ lifetimeValue: 0.05 });
  }
};

export const trackDemo = {
  viewed: () => {
    analytics.track(AnalyticsEvent.DEMO_VIEW);
  },
  
  productClicked: (productId: string, restricted: boolean) => {
    analytics.track(AnalyticsEvent.DEMO_PRODUCT_CLICKED, { 
      productId, 
      restricted 
    });
  },
  
  ageGateShown: (productId: string) => {
    analytics.track(AnalyticsEvent.DEMO_AGE_GATE_SHOWN, { productId });
  },
  
  verificationStarted: () => {
    analytics.track(AnalyticsEvent.DEMO_VERIFICATION_STARTED);
  },
  
  verificationCompleted: () => {
    analytics.track(AnalyticsEvent.DEMO_VERIFICATION_COMPLETED);
    analytics.trackConversionStep('demo_completed');
  },
  
  statsViewed: () => {
    analytics.track(AnalyticsEvent.DEMO_STATS_VIEWED);
  }
};

// Auto-track page views on route change
if (typeof window !== 'undefined') {
  const originalPushState = window.history.pushState;
  window.history.pushState = function(...args) {
    originalPushState.apply(window.history, args);
    analytics.trackPageView();
  };
  
  window.addEventListener('popstate', () => {
    analytics.trackPageView();
  });
}

// Global error tracking
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    analytics.track(AnalyticsEvent.PAGE_VIEW, {
      errorMessage: event.message,
      errorStack: event.error?.stack,
      page: window.location.pathname
    });
  });
}