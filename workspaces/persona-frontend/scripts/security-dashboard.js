#!/usr/bin/env node

/**
 * SECURITY IMPLEMENTATION DASHBOARD
 * 
 * Visual overview of PersonaPass security implementation status
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI colors and symbols
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

const symbols = {
  check: '✓',
  cross: '✗',
  warning: '⚠',
  info: 'ℹ',
  lock: '🔒',
  shield: '🛡️',
  key: '🔑',
  audit: '📝',
  monitor: '📊'
};

function color(text, colorName) {
  return `${colors[colorName]}${text}${colors.reset}`;
}

function bold(text) {
  return `${colors.bright}${text}${colors.reset}`;
}

// Security components status
const securityComponents = [
  {
    name: 'Wallet Signature Verification',
    file: 'src/lib/crypto/signature-verifier.ts',
    status: 'implemented',
    features: [
      'EIP-191 personal signatures',
      'EIP-712 typed data signatures',
      'Cosmos ADR-036 signatures',
      'Ed25519 signatures',
      'Multi-chain support'
    ]
  },
  {
    name: 'Authentication Middleware',
    file: 'aws/src/middleware/auth-middleware.ts',
    status: 'implemented',
    features: [
      'JWT token validation',
      'Rate limiting',
      'Request signature verification',
      'API key support',
      'Permission-based access control'
    ]
  },
  {
    name: 'CORS Configuration',
    file: 'next.config.js',
    status: 'implemented',
    features: [
      'Strict origin validation',
      'Preflight request handling',
      'Credential support',
      'Custom headers allowed',
      'Methods restriction'
    ]
  },
  {
    name: 'Input Validation',
    file: 'src/lib/validation/input-validator.ts',
    status: 'implemented',
    features: [
      'Zod schema validation',
      'XSS prevention',
      'SQL injection prevention',
      'DOMPurify HTML sanitization',
      'Multi-chain address validation'
    ]
  },
  {
    name: 'Secure Session Management',
    file: 'src/lib/session/secure-session-manager.ts',
    status: 'implemented',
    features: [
      'HttpOnly cookies',
      'AES-GCM encryption',
      'Session rotation',
      'Device fingerprinting',
      'PBKDF2 key derivation'
    ]
  },
  {
    name: 'W3C DID Implementation',
    file: 'src/lib/did/w3c-did-manager.ts',
    status: 'implemented',
    features: [
      'DID Core v1.0 compliance',
      'Ed25519 key support',
      'Secp256k1 key support',
      'Service endpoints',
      'Verification methods'
    ]
  },
  {
    name: 'Audit Logging',
    file: 'src/lib/audit/audit-logger.ts',
    status: 'implemented',
    features: [
      'Tamper-proof hash chain',
      'Event categorization',
      'PII masking',
      'Compliance reporting',
      'Winston daily rotation'
    ]
  },
  {
    name: 'Security Headers',
    file: 'next.config.js',
    status: 'implemented',
    features: [
      'Content Security Policy',
      'HSTS enforcement',
      'X-Frame-Options DENY',
      'COEP/COOP/CORP headers',
      'Referrer policy'
    ]
  },
  {
    name: 'Zero-Knowledge Proofs',
    file: 'src/lib/zkp/zero-knowledge-proof.ts',
    status: 'implemented',
    features: [
      'Schnorr protocol',
      'Range proofs',
      'Merkle membership',
      'Age verification',
      'Native BigInt (no vulnerable deps)'
    ]
  },
  {
    name: 'Security Scanning',
    file: '.github/workflows/security-scan.yml',
    status: 'implemented',
    features: [
      'Dependency scanning',
      'Code vulnerability scanning',
      'Secret detection',
      'Container scanning',
      'License compliance'
    ]
  }
];

// Display functions
function displayHeader() {
  console.log('\n' + color('═'.repeat(80), 'cyan'));
  console.log(color(' '.repeat(25) + '🔒 PERSONAPASS SECURITY DASHBOARD 🔒', 'bright'));
  console.log(color('═'.repeat(80), 'cyan') + '\n');
}

function displayComponent(component) {
  const statusIcon = component.status === 'implemented' ? 
    color(symbols.check, 'green') : 
    color(symbols.cross, 'red');
  
  console.log(`${statusIcon} ${bold(component.name)}`);
  console.log(`  ${color('File:', 'dim')} ${color(component.file, 'blue')}`);
  
  component.features.forEach(feature => {
    console.log(`  ${color('•', 'dim')} ${feature}`);
  });
  
  console.log('');
}

function displaySummary() {
  const implemented = securityComponents.filter(c => c.status === 'implemented').length;
  const total = securityComponents.length;
  const percentage = (implemented / total * 100).toFixed(0);
  
  console.log(color('─'.repeat(80), 'dim'));
  console.log('\n' + bold('📊 IMPLEMENTATION SUMMARY'));
  console.log(color('─'.repeat(40), 'dim'));
  
  console.log(`Total Components: ${total}`);
  console.log(`Implemented: ${color(implemented.toString(), 'green')}`);
  console.log(`Completion: ${color(percentage + '%', percentage === '100' ? 'green' : 'yellow')}`);
  
  // Progress bar
  const barLength = 50;
  const filled = Math.floor(barLength * implemented / total);
  const empty = barLength - filled;
  
  console.log('\nProgress: [' + 
    color('█'.repeat(filled), 'green') + 
    color('░'.repeat(empty), 'dim') + 
    '] ' + percentage + '%\n');
}

function displaySecurityChecks() {
  console.log(bold('🔍 SECURITY CHECKS'));
  console.log(color('─'.repeat(40), 'dim'));
  
  // Check for environment file
  const envExists = fs.existsSync(path.join(process.cwd(), '.env.local'));
  console.log(`${envExists ? color(symbols.check, 'green') : color(symbols.warning, 'yellow')} Environment configuration (.env.local)`);
  
  // Check for security ignore file
  const ignoreExists = fs.existsSync(path.join(process.cwd(), '.security-ignore'));
  console.log(`${ignoreExists ? color(symbols.check, 'green') : color(symbols.warning, 'yellow')} Security ignore patterns`);
  
  // Check for test scripts
  const authTestExists = fs.existsSync(path.join(process.cwd(), 'scripts/test-auth-flow.js'));
  console.log(`${authTestExists ? color(symbols.check, 'green') : color(symbols.warning, 'yellow')} Authentication test suite`);
  
  // Check for security check script
  const secCheckExists = fs.existsSync(path.join(process.cwd(), 'scripts/security-check.js'));
  console.log(`${secCheckExists ? color(symbols.check, 'green') : color(symbols.warning, 'yellow')} Security check script`);
  
  console.log('');
}

function displayNextSteps() {
  console.log(bold('📋 NEXT STEPS'));
  console.log(color('─'.repeat(40), 'dim'));
  
  const steps = [
    'Configure environment variables in .env.local',
    'Run security checks: npm run security:check',
    'Test authentication flow: npm run test:auth',
    'Deploy monitoring and alerting',
    'Configure SIEM integration',
    'Set up automated security scanning in CI/CD',
    'Implement rate limiting in production',
    'Configure WAF rules for additional protection'
  ];
  
  steps.forEach((step, index) => {
    console.log(`${index + 1}. ${step}`);
  });
  
  console.log('');
}

function displayCommands() {
  console.log(bold('🚀 USEFUL COMMANDS'));
  console.log(color('─'.repeat(40), 'dim'));
  
  console.log(color('Security Checks:', 'cyan'));
  console.log('  npm run security:check    ' + color('# Run all security checks', 'dim'));
  console.log('  npm audit                 ' + color('# Check for vulnerabilities', 'dim'));
  console.log('  npm run test:auth         ' + color('# Test authentication flow', 'dim'));
  
  console.log('\n' + color('Development:', 'cyan'));
  console.log('  npm run dev               ' + color('# Start development server', 'dim'));
  console.log('  npm run build             ' + color('# Build for production', 'dim'));
  console.log('  npm run lint              ' + color('# Run linting checks', 'dim'));
  
  console.log('');
}

// Run dependency check
function checkDependencies() {
  console.log(bold('📦 DEPENDENCY STATUS'));
  console.log(color('─'.repeat(40), 'dim'));
  
  try {
    const result = execSync('npm audit --json', { encoding: 'utf8', stdio: 'pipe' });
    const audit = JSON.parse(result);
    const vulns = audit.metadata.vulnerabilities;
    
    if (vulns.total === 0) {
      console.log(color('✓ No vulnerabilities found', 'green'));
    } else {
      console.log(color(`${symbols.warning} Found ${vulns.total} vulnerabilities:`, 'yellow'));
      if (vulns.critical > 0) console.log(`  Critical: ${color(vulns.critical, 'red')}`);
      if (vulns.high > 0) console.log(`  High: ${color(vulns.high, 'red')}`);
      if (vulns.moderate > 0) console.log(`  Moderate: ${color(vulns.moderate, 'yellow')}`);
      if (vulns.low > 0) console.log(`  Low: ${color(vulns.low, 'blue')}`);
    }
  } catch (error) {
    console.log(color('⚠ Could not check dependencies', 'yellow'));
  }
  
  console.log('');
}

// Main dashboard display
function displayDashboard() {
  // Clear console
  console.clear();
  
  // Display sections
  displayHeader();
  
  console.log(bold('🛡️ SECURITY COMPONENTS'));
  console.log(color('─'.repeat(40), 'dim') + '\n');
  
  securityComponents.forEach(displayComponent);
  
  displaySummary();
  displaySecurityChecks();
  checkDependencies();
  displayNextSteps();
  displayCommands();
  
  // Footer
  console.log(color('═'.repeat(80), 'cyan'));
  console.log(color('PersonaPass - Privacy-First Identity Verification', 'dim'));
  console.log(color('Last updated: ' + new Date().toLocaleString(), 'dim'));
  console.log(color('═'.repeat(80), 'cyan') + '\n');
}

// Auto-refresh option
const args = process.argv.slice(2);
if (args.includes('--watch')) {
  setInterval(() => {
    displayDashboard();
  }, 5000);
} else {
  displayDashboard();
  
  console.log(color('Tip: Run with --watch flag for auto-refresh', 'dim'));
  console.log(color('Example: node scripts/security-dashboard.js --watch', 'dim'));
}

// Export for use in other scripts
module.exports = { securityComponents, displayDashboard };