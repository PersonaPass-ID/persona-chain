# 🚀 PersonaPass Wallet-Only API - Production Dockerfile
# Pure wallet-based authentication system - no phone/email verification

FROM node:18-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install all dependencies (needed for building)
RUN npm ci

# Copy source code and build the application
COPY . .
RUN npm run build

# Remove dev dependencies after build
RUN npm prune --production

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S persona -u 1001

# Change ownership of the app directory
RUN chown -R persona:nodejs /usr/src/app
USER persona

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const http = require('http'); \
  const options = { hostname: 'localhost', port: 3001, path: '/api/health', timeout: 2000 }; \
  const req = http.request(options, (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }); \
  req.on('error', () => process.exit(1)); \
  req.on('timeout', () => { req.destroy(); process.exit(1); }); \
  req.end();"

# Start the application
CMD ["node", "dist/main"]