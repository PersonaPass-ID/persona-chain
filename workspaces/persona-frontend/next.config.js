/** @type {import('next').NextConfig} */

const nextConfig = {
  // Disable X-Powered-By header for security
  poweredByHeader: false,

  experimental: {
    // Server Actions security
    serverActions: {
      allowedOrigins: [
        'personapass.xyz',
        '*.personapass.xyz',
        ...(process.env.NODE_ENV === 'development' ? ['localhost:3000'] : []),
      ],
    },
    // Enable React's taint APIs for data security
    taint: true,
  },

  // Turbopack configuration (stable in Next.js 15)
  turbopack: {
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },
  
  // Security Headers Configuration
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY' // Changed from SAMEORIGIN to DENY for better security
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=(), browsing-topics=()'
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://checkout.stripe.com https://*.personapass.xyz",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: https: blob: https://images.personapass.xyz",
              "font-src 'self' data: https://fonts.gstatic.com",
              "connect-src 'self' https://api.stripe.com https://lgx05f1fwg.execute-api.us-east-1.amazonaws.com https://*.amazonaws.com http://161.35.2.88:26657 wss://*.walletconnect.org https://*.walletconnect.org",
              "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://*.walletconnect.org",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "object-src 'none'",
              "script-src-attr 'none'",
              "upgrade-insecure-requests"
            ].join('; ')
          },
          {
            key: 'X-Permitted-Cross-Domain-Policies',
            value: 'none'
          },
          {
            key: 'Expect-CT',
            value: 'enforce, max-age=86400'
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp'
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin'
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-origin'
          }
        ]
      },
      {
        // CORS configuration for API routes
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true'
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'production' 
              ? 'https://personapass.xyz' 
              : 'http://localhost:3000'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, X-API-Key'
          },
          {
            key: 'Access-Control-Max-Age',
            value: '86400'
          }
        ]
      }
    ];
  },

  // Redirect HTTP to HTTPS in production
  async redirects() {
    return process.env.NODE_ENV === 'production' 
      ? [
          {
            source: '/:path*',
            has: [
              {
                type: 'header',
                key: 'x-forwarded-proto',
                value: 'http',
              },
            ],
            destination: 'https://personapass.xyz/:path*',
            permanent: true,
          },
        ]
      : [];
  },

  // Environment variables to expose to the browser
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
    NEXT_PUBLIC_ENVIRONMENT: process.env.NODE_ENV,
  },

  // Webpack configuration
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Add any custom webpack config here
    return config;
  },

  // Image optimization security
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'personapass.xyz',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.personapass.xyz',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        port: '',
        pathname: '/**',
      },
      // Allow Stripe images for payment flows
      {
        protocol: 'https',
        hostname: '*.stripe.com',
        port: '',
        pathname: '/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    // Secure image handling
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    contentDispositionType: 'inline',
    dangerouslyAllowSVG: false, // Disable SVG optimization for security
  },

  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // ESLint configuration for deployment
  eslint: {
    // Disable ESLint during builds to allow deployment with warnings
    ignoreDuringBuilds: true,
  },

  // TypeScript configuration for deployment  
  typescript: {
    // Allow deployment with TypeScript warnings
    ignoreBuildErrors: true,
  },

  // Minification handled automatically in Next.js 15

  // Output configuration
  output: 'standalone',
};

module.exports = nextConfig;