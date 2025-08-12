#!/usr/bin/env node

/**
 * LOCAL SECURITY CHECK SCRIPT
 * 
 * Run security checks locally before pushing code:
 * - Dependency vulnerabilities
 * - Known security issues
 * - License compliance
 * - Outdated packages
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Security check results
const results = {
  passed: [],
  warnings: [],
  failures: []
};

/**
 * Run a command and return output
 */
function runCommand(command, options = {}) {
  try {
    const output = execSync(command, {
      encoding: 'utf8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options
    });
    return { success: true, output };
  } catch (error) {
    return { 
      success: false, 
      output: error.stdout || error.message,
      error: error.message 
    };
  }
}

/**
 * Print colored message
 */
function print(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Check for npm vulnerabilities
 */
function checkNpmAudit() {
  print('\n📋 Running npm audit...', 'cyan');
  
  const result = runCommand('npm audit --json', { silent: true });
  
  if (result.success) {
    try {
      const audit = JSON.parse(result.output);
      const vulnerabilities = audit.metadata.vulnerabilities;
      
      if (vulnerabilities.total === 0) {
        print('✅ No vulnerabilities found', 'green');
        results.passed.push('npm audit');
      } else {
        const critical = vulnerabilities.critical || 0;
        const high = vulnerabilities.high || 0;
        const moderate = vulnerabilities.moderate || 0;
        const low = vulnerabilities.low || 0;
        
        if (critical > 0 || high > 0) {
          print(`❌ Found ${critical} critical and ${high} high vulnerabilities`, 'red');
          results.failures.push(`npm audit: ${critical} critical, ${high} high vulnerabilities`);
        } else {
          print(`⚠️  Found ${moderate} moderate and ${low} low vulnerabilities`, 'yellow');
          results.warnings.push(`npm audit: ${moderate} moderate, ${low} low vulnerabilities`);
        }
        
        // Show details
        runCommand('npm audit', { silent: false });
      }
    } catch (error) {
      print('❌ Failed to parse audit results', 'red');
      results.failures.push('npm audit: parse error');
    }
  } else {
    print('❌ npm audit failed', 'red');
    results.failures.push('npm audit: command failed');
  }
}

/**
 * Check for outdated packages
 */
function checkOutdated() {
  print('\n📋 Checking for outdated packages...', 'cyan');
  
  const result = runCommand('npm outdated --json', { silent: true });
  
  try {
    const outdated = result.output ? JSON.parse(result.output) : {};
    const packages = Object.keys(outdated);
    
    if (packages.length === 0) {
      print('✅ All packages are up to date', 'green');
      results.passed.push('outdated packages');
    } else {
      const majorUpdates = packages.filter(pkg => {
        const current = outdated[pkg].current;
        const latest = outdated[pkg].latest;
        return current && latest && current.split('.')[0] !== latest.split('.')[0];
      });
      
      if (majorUpdates.length > 0) {
        print(`⚠️  ${majorUpdates.length} packages have major updates available`, 'yellow');
        results.warnings.push(`outdated packages: ${majorUpdates.length} major updates`);
        
        console.log('\nPackages with major updates:');
        majorUpdates.forEach(pkg => {
          const info = outdated[pkg];
          console.log(`  ${pkg}: ${info.current} → ${info.latest}`);
        });
      } else {
        print(`ℹ️  ${packages.length} packages have minor updates available`, 'blue');
        results.passed.push('outdated packages: only minor updates');
      }
    }
  } catch (error) {
    print('⚠️  Could not check for outdated packages', 'yellow');
    results.warnings.push('outdated packages: check failed');
  }
}

/**
 * Check for known security issues in dependencies
 */
function checkSecurityIssues() {
  print('\n📋 Checking for known security issues...', 'cyan');
  
  const packageJson = require(path.join(process.cwd(), 'package.json'));
  const riskyPackages = [
    'electron',
    'node-sass',
    'request',
    'bower',
    'gulp',
    'grunt'
  ];
  
  const foundRisky = [];
  
  Object.keys(packageJson.dependencies || {}).forEach(pkg => {
    if (riskyPackages.includes(pkg)) {
      foundRisky.push(pkg);
    }
  });
  
  Object.keys(packageJson.devDependencies || {}).forEach(pkg => {
    if (riskyPackages.includes(pkg)) {
      foundRisky.push(pkg);
    }
  });
  
  if (foundRisky.length > 0) {
    print(`⚠️  Found ${foundRisky.length} packages with known issues: ${foundRisky.join(', ')}`, 'yellow');
    results.warnings.push(`risky packages: ${foundRisky.join(', ')}`);
  } else {
    print('✅ No known risky packages found', 'green');
    results.passed.push('risky packages');
  }
}

/**
 * Check for license compliance
 */
function checkLicenses() {
  print('\n📋 Checking license compliance...', 'cyan');
  
  const result = runCommand('npx license-checker --json --onlyAllow "MIT;Apache-2.0;BSD-3-Clause;BSD-2-Clause;ISC;CC0-1.0;Unlicense"', { silent: true });
  
  if (result.success) {
    print('✅ All licenses are compliant', 'green');
    results.passed.push('license compliance');
  } else {
    print('⚠️  Some packages have non-standard licenses', 'yellow');
    results.warnings.push('license compliance: non-standard licenses found');
    
    // Run again without filter to show which packages
    print('\nPackages with non-standard licenses:', 'yellow');
    runCommand('npx license-checker --exclude "MIT,Apache-2.0,BSD-3-Clause,BSD-2-Clause,ISC,CC0-1.0,Unlicense"', { silent: false });
  }
}

/**
 * Check for secrets in code
 */
function checkSecrets() {
  print('\n📋 Checking for secrets in code...', 'cyan');
  
  const patterns = [
    { pattern: /api[_-]?key\s*[:=]\s*["'][^"']+["']/gi, name: 'API keys' },
    { pattern: /secret\s*[:=]\s*["'][^"']+["']/gi, name: 'Secrets' },
    { pattern: /password\s*[:=]\s*["'][^"']+["']/gi, name: 'Passwords' },
    { pattern: /private[_-]?key\s*[:=]\s*["'][^"']+["']/gi, name: 'Private keys' },
    { pattern: /aws[_-]?access[_-]?key[_-]?id\s*[:=]\s*["'][^"']+["']/gi, name: 'AWS keys' }
  ];
  
  // Load ignore patterns
  const ignorePatterns = [];
  const ignoreFile = path.join(process.cwd(), '.security-ignore');
  if (fs.existsSync(ignoreFile)) {
    const ignoreContent = fs.readFileSync(ignoreFile, 'utf8');
    ignoreContent.split('\n').forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#')) {
        ignorePatterns.push(line);
      }
    });
  }
  
  const srcDir = path.join(process.cwd(), 'src');
  const foundSecrets = [];
  
  function scanFile(filePath) {
    if (filePath.includes('node_modules') || filePath.includes('.git')) return;
    
    // Check if file should be ignored
    const relativePath = path.relative(process.cwd(), filePath);
    for (const ignorePattern of ignorePatterns) {
      if (ignorePattern.includes('*')) {
        // Handle glob patterns
        const regex = new RegExp(ignorePattern.replace(/\*/g, '.*'));
        if (regex.test(relativePath)) return;
      } else if (ignorePattern.includes(':')) {
        // Handle specific file:pattern ignores
        const [file, pattern] = ignorePattern.split(':');
        if (relativePath.includes(file) && pattern) return;
      } else if (relativePath.includes(ignorePattern)) {
        return;
      }
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    
    patterns.forEach(({ pattern, name }) => {
      const matches = content.match(pattern);
      if (matches) {
        // Double-check it's not just an interface/prop definition
        const isInterfaceOrProp = matches.every(match => {
          const lines = content.split('\n');
          const matchLine = lines.find(line => line.includes(match));
          return matchLine && (
            matchLine.includes('interface') ||
            matchLine.includes('type') ||
            matchLine.includes('props') ||
            matchLine.includes('config') ||
            matchLine.includes(': string') ||
            matchLine.includes('?:')
          );
        });
        
        if (!isInterfaceOrProp) {
          foundSecrets.push({ file: filePath, type: name, count: matches.length });
        }
      }
    });
  }
  
  function scanDirectory(dir) {
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scanDirectory(fullPath);
      } else if (stat.isFile() && /\.(js|jsx|ts|tsx|json)$/.test(item)) {
        scanFile(fullPath);
      }
    });
  }
  
  if (fs.existsSync(srcDir)) {
    scanDirectory(srcDir);
  }
  
  if (foundSecrets.length > 0) {
    print(`❌ Found potential secrets in ${foundSecrets.length} files`, 'red');
    foundSecrets.forEach(({ file, type, count }) => {
      console.log(`  ${file}: ${count} potential ${type}`);
    });
    results.failures.push(`secrets: found in ${foundSecrets.length} files`);
  } else {
    print('✅ No hardcoded secrets found', 'green');
    results.passed.push('secrets scan');
  }
}

/**
 * Main function
 */
function main() {
  print('\n🔒 PersonaPass Security Check\n', 'magenta');
  print('Running security checks...', 'cyan');
  
  // Run all checks
  checkNpmAudit();
  checkOutdated();
  checkSecurityIssues();
  checkLicenses();
  checkSecrets();
  
  // Print summary
  print('\n📊 Security Check Summary', 'magenta');
  print('=' .repeat(50), 'cyan');
  
  if (results.passed.length > 0) {
    print(`\n✅ Passed (${results.passed.length}):`, 'green');
    results.passed.forEach(check => print(`   • ${check}`, 'green'));
  }
  
  if (results.warnings.length > 0) {
    print(`\n⚠️  Warnings (${results.warnings.length}):`, 'yellow');
    results.warnings.forEach(check => print(`   • ${check}`, 'yellow'));
  }
  
  if (results.failures.length > 0) {
    print(`\n❌ Failed (${results.failures.length}):`, 'red');
    results.failures.forEach(check => print(`   • ${check}`, 'red'));
  }
  
  print('\n' + '=' .repeat(50), 'cyan');
  
  // Exit with appropriate code
  if (results.failures.length > 0) {
    print('\n❌ Security check failed!', 'red');
    print('Please fix the issues above before proceeding.', 'red');
    process.exit(1);
  } else if (results.warnings.length > 0) {
    print('\n⚠️  Security check passed with warnings', 'yellow');
    print('Consider addressing the warnings above.', 'yellow');
    process.exit(0);
  } else {
    print('\n✅ All security checks passed!', 'green');
    process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { checkNpmAudit, checkOutdated, checkSecurityIssues, checkLicenses, checkSecrets };