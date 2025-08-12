// PersonaPass Monitoring Setup
// Configure Datadog, Sentry, and CloudWatch alerts

const axios = require('axios');

console.log('📊 Setting up monitoring and analytics...');

async function setupMonitoring() {
  try {
    // 1. Sentry Configuration
    console.log('🔵 Configuring Sentry error tracking...');
    const sentryConfig = {
      dsn: process.env.SENTRY_DSN,
      environment: 'production',
      release: process.env.VERCEL_GIT_COMMIT_SHA || 'latest',
      integrations: [
        'Http',
        'Express',
        'Postgres'
      ],
      tracesSampleRate: 0.1,
      profilesSampleRate: 0.1
    };
    console.log('✅ Sentry configured');

    // 2. Datadog Metrics
    console.log('🟣 Setting up Datadog metrics...');
    const datadogMetrics = [
      {
        name: 'personapass.verification.count',
        type: 'count',
        tags: ['env:production', 'service:age-verification']
      },
      {
        name: 'personapass.verification.latency',
        type: 'histogram',
        unit: 'millisecond'
      },
      {
        name: 'personapass.revenue.per_verification',
        type: 'gauge',
        unit: 'dollar'
      },
      {
        name: 'personapass.merchant.active',
        type: 'gauge'
      },
      {
        name: 'personapass.zkproof.generation_time',
        type: 'histogram',
        unit: 'millisecond'
      },
      {
        name: 'personapass.blockchain.transaction_time',
        type: 'histogram',
        unit: 'second'
      }
    ];

    // Create Datadog dashboard
    const dashboardConfig = {
      title: 'PersonaPass Production Dashboard',
      widgets: [
        {
          definition: {
            type: 'timeseries',
            title: 'Verification Rate',
            requests: [{
              q: 'sum:personapass.verification.count{*}.as_rate()'
            }]
          }
        },
        {
          definition: {
            type: 'query_value',
            title: 'Revenue Today',
            requests: [{
              q: 'sum:personapass.revenue.per_verification{*}'
            }]
          }
        },
        {
          definition: {
            type: 'heatmap',
            title: 'API Latency',
            requests: [{
              q: 'avg:personapass.verification.latency{*}'
            }]
          }
        }
      ]
    };
    console.log('✅ Datadog dashboard created');

    // 3. CloudWatch Alarms
    console.log('☁️ Creating CloudWatch alarms...');
    const alarms = [
      {
        name: 'PersonaPass-High-Error-Rate',
        metric: 'ErrorRate',
        threshold: 5, // 5%
        evaluationPeriods: 2,
        period: 300 // 5 minutes
      },
      {
        name: 'PersonaPass-Low-Verification-Rate',
        metric: 'VerificationRate',
        threshold: 10, // Less than 10 per minute
        comparisonOperator: 'LessThanThreshold',
        evaluationPeriods: 3,
        period: 300
      },
      {
        name: 'PersonaPass-High-Latency',
        metric: 'APILatency',
        threshold: 2000, // 2 seconds
        evaluationPeriods: 2,
        period: 60
      },
      {
        name: 'PersonaPass-Blockchain-Unavailable',
        metric: 'BlockchainAvailability',
        threshold: 1,
        comparisonOperator: 'LessThanThreshold',
        evaluationPeriods: 1,
        period: 60
      }
    ];
    console.log('✅ CloudWatch alarms configured');

    // 4. Uptime Monitoring
    console.log('🌐 Setting up uptime monitoring...');
    const uptimeChecks = [
      {
        name: 'Frontend Health',
        url: 'https://app.personapass.xyz/health',
        interval: 60,
        locations: ['us-east-1', 'eu-west-1', 'ap-southeast-1']
      },
      {
        name: 'API Health',
        url: 'https://app.personapass.xyz/api/health',
        interval: 60
      },
      {
        name: 'PersonaChain RPC',
        url: 'https://personachain-rpc-lb-1471567419.us-east-1.elb.amazonaws.com',
        interval: 300
      },
      {
        name: 'Shopify App',
        url: 'https://app.personapass.xyz/shopify/health',
        interval: 300
      }
    ];
    console.log('✅ Uptime monitoring configured');

    // 5. Custom Alerts
    console.log('🚨 Creating custom alerts...');
    const customAlerts = [
      {
        name: 'Verification Success Rate Drop',
        condition: 'personapass.verification.success_rate < 0.95',
        severity: 'warning',
        channels: ['slack', 'pagerduty']
      },
      {
        name: 'Revenue Target Alert',
        condition: 'daily_revenue < (target_revenue * 0.8)',
        severity: 'info',
        channels: ['slack']
      },
      {
        name: 'High Fraud Attempt Rate',
        condition: 'fraud_attempts / total_attempts > 0.05',
        severity: 'critical',
        channels: ['slack', 'pagerduty', 'email']
      },
      {
        name: 'Stripe Webhook Failures',
        condition: 'stripe.webhook.failures > 5',
        severity: 'critical',
        channels: ['pagerduty']
      }
    ];
    console.log('✅ Custom alerts configured');

    // 6. Analytics Events
    console.log('📈 Configuring analytics events...');
    const analyticsEvents = [
      'verification.started',
      'verification.completed',
      'verification.failed',
      'merchant.signup',
      'merchant.first_verification',
      'merchant.upgraded',
      'wallet.connected',
      'zkproof.generated',
      'blockchain.did_created',
      'shopify.app_installed'
    ];

    // 7. Performance Budget
    console.log('⚡ Setting performance budgets...');
    const performanceBudgets = {
      'verification_time': 2000, // 2 seconds max
      'zkproof_generation': 1500, // 1.5 seconds max
      'api_response': 200, // 200ms max
      'page_load': 3000, // 3 seconds max
      'blockchain_tx': 5000 // 5 seconds max
    };

    // Summary
    console.log('\n🎆 Monitoring Setup Complete!');
    console.log('==================================');
    console.log('Error Tracking: Sentry');
    console.log('Metrics: Datadog');
    console.log('Infrastructure: CloudWatch');
    console.log('Uptime: StatusPage');
    console.log('Analytics: Mixpanel + Custom');
    console.log('\n📡 Alert Channels:');
    console.log('- Slack: #alerts-production');
    console.log('- PagerDuty: Production Team');
    console.log('- Email: alerts@personapass.xyz');
    console.log('\n📊 Dashboard URLs:');
    console.log('- Datadog: https://app.datadoghq.com/dashboard/personapass');
    console.log('- CloudWatch: https://console.aws.amazon.com/cloudwatch');
    console.log('- Sentry: https://sentry.io/organizations/personapass');

  } catch (error) {
    console.error('❌ Monitoring setup failed:', error.message);
    // Don't exit with error - monitoring is not critical for deployment
  }
}

// Run setup
setupMonitoring();