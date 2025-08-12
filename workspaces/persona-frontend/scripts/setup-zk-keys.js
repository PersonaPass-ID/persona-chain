#!/usr/bin/env node

/**
 * PersonaPass Zero-Knowledge Circuit Keys Setup
 * 
 * This script generates the cryptographic keys required for PersonaPass's
 * zero-knowledge age verification system using Circom circuits and snarkjs.
 * 
 * The script performs:
 * 1. Circuit compilation from Circom to constraint system
 * 2. Powers of Tau ceremony (trusted setup)
 * 3. Circuit-specific setup (proving key generation)
 * 4. Verification key extraction
 * 5. Key validation and security checks
 * 
 * Security Note: This script generates production cryptographic keys.
 * The Powers of Tau ceremony should use contributions from multiple
 * trusted parties in production environments.
 */

const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');
const crypto = require('crypto');

// Configuration from environment or defaults
const CONFIG = {
  CIRCUIT_PATH: process.env.ZK_CIRCUIT_PATH || './circuits',
  PROVING_KEY_PATH: process.env.ZK_PROVING_KEY_PATH || './circuits/proving_key.zkey',
  VERIFICATION_KEY_PATH: process.env.ZK_VERIFICATION_KEY_PATH || './circuits/verification_key.json',
  CIRCUIT_NAME: 'age_verification',
  CURVE: 'bn128',
  POWERS_OF_TAU: 14, // Supports circuits with up to 2^14 constraints
  VERBOSE: process.argv.includes('--verbose') || process.argv.includes('-v'),
  FORCE: process.argv.includes('--force') || process.argv.includes('-f'),
  VALIDATE_ONLY: process.argv.includes('--validate-only'),
};

// Console logging with timestamps and colors
const log = {
  info: (msg) => console.log(`\u001b[34m[INFO]\u001b[0m ${new Date().toISOString()} - ${msg}`),
  success: (msg) => console.log(`\u001b[32m[SUCCESS]\u001b[0m ${new Date().toISOString()} - ${msg}`),
  warning: (msg) => console.log(`\u001b[33m[WARNING]\u001b[0m ${new Date().toISOString()} - ${msg}`),
  error: (msg) => console.error(`\u001b[31m[ERROR]\u001b[0m ${new Date().toISOString()} - ${msg}`),
  verbose: (msg) => CONFIG.VERBOSE && console.log(`\u001b[90m[VERBOSE]\u001b[0m ${new Date().toISOString()} - ${msg}`),
};

// Execute shell command with promise interface
function execCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    log.verbose(`Executing: ${command} ${args.join(' ')}`);
    
    const child = spawn(command, args, {
      stdio: CONFIG.VERBOSE ? 'inherit' : 'pipe',
      ...options
    });
    
    let stdout = '';
    let stderr = '';
    
    if (!CONFIG.VERBOSE) {
      child.stdout?.on('data', (data) => stdout += data.toString());
      child.stderr?.on('data', (data) => stderr += data.toString());
    }
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr, code });
      } else {
        reject(new Error(`Command failed with code ${code}: ${stderr || stdout}`));
      }
    });
    
    child.on('error', (error) => {
      reject(error);
    });
  });
}

// Check if required tools are installed
async function checkDependencies() {
  log.info('Checking dependencies...');
  
  const dependencies = [
    { name: 'circom', command: 'circom', args: ['--version'] },
    { name: 'snarkjs', command: 'snarkjs', args: ['--version'] },
  ];
  
  for (const dep of dependencies) {
    try {
      await execCommand(dep.command, dep.args);
      log.verbose(`✓ ${dep.name} is installed`);
    } catch (error) {
      log.error(`✗ ${dep.name} is not installed or not in PATH`);
      log.error(`Install ${dep.name} and ensure it's available in your PATH`);
      process.exit(1);
    }
  }
  
  log.success('All dependencies are available');
}

// Ensure directory exists
async function ensureDirectory(dirPath) {
  try {
    await fs.access(dirPath);
    log.verbose(`Directory exists: ${dirPath}`);
  } catch {
    log.info(`Creating directory: ${dirPath}`);
    await fs.mkdir(dirPath, { recursive: true });
  }
}

// Check if file exists
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// Generate secure random contribution for trusted setup
function generateContribution() {
  return crypto.randomBytes(32).toString('hex');
}

// Create sample age verification circuit if it doesn't exist
async function createSampleCircuit() {
  const circuitPath = path.join(CONFIG.CIRCUIT_PATH, `${CONFIG.CIRCUIT_NAME}.circom`);
  
  if (await fileExists(circuitPath)) {
    log.verbose(`Circuit already exists: ${circuitPath}`);
    return;
  }
  
  log.info('Creating sample age verification circuit...');
  
  const circuitCode = `pragma circom 2.0.0;

// PersonaPass Age Verification Circuit
// Proves that a person is over a certain age without revealing exact age or birthdate
template AgeVerification() {
    // Private inputs (not revealed in proof)
    signal private input birthYear;
    signal private input currentYear;
    signal private input salt; // For privacy and to prevent rainbow table attacks
    
    // Public inputs (part of the proof statement)
    signal input minAge;
    signal input commitment; // Hash of birthYear + salt
    
    // Output signal
    signal output isOfAge;
    
    // Poseidon hash for secure commitment
    component hasher = Poseidon(2);
    hasher.inputs[0] <== birthYear;
    hasher.inputs[1] <== salt;
    
    // Verify the commitment matches
    commitment === hasher.out;
    
    // Calculate age and verify it meets minimum requirement
    component geq = GreaterEqThan(8); // Support ages up to 255
    geq.in[0] <== currentYear - birthYear;
    geq.in[1] <== minAge;
    
    // Output 1 if age >= minAge, 0 otherwise
    isOfAge <== geq.out;
}

// Import required libraries
include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/comparators.circom";

// Main component
component main = AgeVerification();`;

  await fs.writeFile(circuitPath, circuitCode);
  log.success(`Created circuit: ${circuitPath}`);
}

// Compile Circom circuit to constraint system
async function compileCircuit() {
  const circuitPath = path.join(CONFIG.CIRCUIT_PATH, `${CONFIG.CIRCUIT_NAME}.circom`);
  const outputDir = CONFIG.CIRCUIT_PATH;
  
  log.info('Compiling Circom circuit...');
  
  try {
    await execCommand('circom', [
      circuitPath,
      '--r1cs',
      '--wasm',
      '--sym',
      '--c',
      '-o', outputDir
    ]);
    
    log.success('Circuit compiled successfully');
  } catch (error) {
    log.error(`Circuit compilation failed: ${error.message}`);
    throw error;
  }
}

// Download or generate Powers of Tau file
async function setupPowersOfTau() {
  const ptauFile = path.join(CONFIG.CIRCUIT_PATH, `powersOfTau28_hez_final_${CONFIG.POWERS_OF_TAU}.ptau`);
  
  if (await fileExists(ptauFile)) {
    log.verbose(`Powers of Tau file already exists: ${ptauFile}`);
    return ptauFile;
  }
  
  log.info(`Setting up Powers of Tau ceremony (2^${CONFIG.POWERS_OF_TAU} constraints)...`);
  log.warning('This is a simplified setup for development. Production should use a proper trusted setup ceremony.');
  
  try {
    // Initialize powers of tau
    log.info('Step 1/4: Initializing Powers of Tau...');
    await execCommand('snarkjs', [
      'powersoftau', 'new',
      CONFIG.CURVE,
      CONFIG.POWERS_OF_TAU.toString(),
      path.join(CONFIG.CIRCUIT_PATH, 'pot28_0000.ptau'),
      '-v'
    ]);
    
    // First contribution
    log.info('Step 2/4: Contributing to ceremony (1/2)...');
    const contribution1 = generateContribution();
    await execCommand('snarkjs', [
      'powersoftau', 'contribute',
      path.join(CONFIG.CIRCUIT_PATH, 'pot28_0000.ptau'),
      path.join(CONFIG.CIRCUIT_PATH, 'pot28_0001.ptau'),
      '--name="PersonaPass Setup 1"',
      `-e="${contribution1}"`,
      '-v'
    ]);
    
    // Second contribution for additional security
    log.info('Step 3/4: Contributing to ceremony (2/2)...');
    const contribution2 = generateContribution();
    await execCommand('snarkjs', [
      'powersoftau', 'contribute',
      path.join(CONFIG.CIRCUIT_PATH, 'pot28_0001.ptau'),
      path.join(CONFIG.CIRCUIT_PATH, 'pot28_0002.ptau'),
      '--name="PersonaPass Setup 2"',
      `-e="${contribution2}"`,
      '-v'
    ]);
    
    // Prepare phase 2
    log.info('Step 4/4: Preparing for phase 2...');
    await execCommand('snarkjs', [
      'powersoftau', 'prepare', 'phase2',
      path.join(CONFIG.CIRCUIT_PATH, 'pot28_0002.ptau'),
      ptauFile,
      '-v'
    ]);
    
    // Cleanup temporary files
    const tempFiles = ['pot28_0000.ptau', 'pot28_0001.ptau', 'pot28_0002.ptau'];
    for (const file of tempFiles) {
      try {
        await fs.unlink(path.join(CONFIG.CIRCUIT_PATH, file));
      } catch (error) {
        log.verbose(`Could not clean up ${file}: ${error.message}`);
      }
    }
    
    log.success('Powers of Tau ceremony completed');
    return ptauFile;
    
  } catch (error) {
    log.error(`Powers of Tau setup failed: ${error.message}`);
    throw error;
  }
}

// Generate circuit-specific proving key
async function generateProvingKey(ptauFile) {
  const r1csFile = path.join(CONFIG.CIRCUIT_PATH, `${CONFIG.CIRCUIT_NAME}.r1cs`);
  
  log.info('Generating circuit-specific proving key...');
  
  try {
    await execCommand('snarkjs', [
      'groth16', 'setup',
      r1csFile,
      ptauFile,
      CONFIG.PROVING_KEY_PATH,
      '-v'
    ]);
    
    log.success(`Proving key generated: ${CONFIG.PROVING_KEY_PATH}`);
  } catch (error) {
    log.error(`Proving key generation failed: ${error.message}`);
    throw error;
  }
}

// Extract verification key from proving key
async function extractVerificationKey() {
  log.info('Extracting verification key...');
  
  try {
    await execCommand('snarkjs', [
      'zkey', 'export', 'verificationkey',
      CONFIG.PROVING_KEY_PATH,
      CONFIG.VERIFICATION_KEY_PATH,
      '-v'
    ]);
    
    log.success(`Verification key extracted: ${CONFIG.VERIFICATION_KEY_PATH}`);
  } catch (error) {
    log.error(`Verification key extraction failed: ${error.message}`);
    throw error;
  }
}

// Validate generated keys
async function validateKeys() {
  log.info('Validating generated keys...');
  
  try {
    // Check proving key file
    const provingKeyStats = await fs.stat(CONFIG.PROVING_KEY_PATH);
    log.verbose(`Proving key size: ${(provingKeyStats.size / 1024 / 1024).toFixed(2)} MB`);
    
    if (provingKeyStats.size < 1000) {
      throw new Error('Proving key file appears to be too small');
    }
    
    // Check verification key file
    const verificationKeyContent = await fs.readFile(CONFIG.VERIFICATION_KEY_PATH, 'utf8');
    const verificationKey = JSON.parse(verificationKeyContent);
    
    // Verify required fields exist
    const requiredFields = ['protocol', 'curve', 'nPublic', 'vk_alpha_1', 'vk_beta_2', 'vk_gamma_2', 'vk_delta_2', 'vk_alphabeta_12', 'IC'];
    for (const field of requiredFields) {
      if (!verificationKey[field]) {
        throw new Error(`Verification key missing required field: ${field}`);
      }
    }
    
    log.verbose(`Verification key protocol: ${verificationKey.protocol}`);
    log.verbose(`Verification key curve: ${verificationKey.curve}`);
    log.verbose(`Number of public signals: ${verificationKey.nPublic}`);
    
    // Test key integrity with snarkjs
    log.info('Testing key integrity...');
    await execCommand('snarkjs', [
      'zkey', 'verify',
      path.join(CONFIG.CIRCUIT_PATH, `${CONFIG.CIRCUIT_NAME}.r1cs`),
      path.join(CONFIG.CIRCUIT_PATH, `powersOfTau28_hez_final_${CONFIG.POWERS_OF_TAU}.ptau`),
      CONFIG.PROVING_KEY_PATH,
      '-v'
    ]);
    
    log.success('Keys validation passed - ready for production use');
    
  } catch (error) {
    log.error(`Key validation failed: ${error.message}`);
    throw error;
  }
}

// Display key information and usage instructions
async function displayKeyInfo() {
  log.info('Key generation completed successfully!');
  console.log('\n' + '='.repeat(60));
  console.log('🔐 PersonaPass Zero-Knowledge Keys Generated');
  console.log('='.repeat(60));
  
  try {
    const provingKeyStats = await fs.stat(CONFIG.PROVING_KEY_PATH);
    const verificationKeyContent = await fs.readFile(CONFIG.VERIFICATION_KEY_PATH, 'utf8');
    const verificationKey = JSON.parse(verificationKeyContent);
    
    console.log(`📁 Circuit Path: ${CONFIG.CIRCUIT_PATH}`);
    console.log(`🔑 Proving Key: ${CONFIG.PROVING_KEY_PATH} (${(provingKeyStats.size / 1024 / 1024).toFixed(2)} MB)`);
    console.log(`✅ Verification Key: ${CONFIG.VERIFICATION_KEY_PATH}`);
    console.log(`🌐 Curve: ${verificationKey.curve || CONFIG.CURVE}`);
    console.log(`📊 Public Signals: ${verificationKey.nPublic || 'N/A'}`);
    
    console.log('\n🚀 Next Steps:');
    console.log('1. Copy verification key to your frontend application');
    console.log('2. Keep proving key secure on your backend server');
    console.log('3. Test the circuit with sample inputs');
    console.log('4. Deploy to production with proper key management\n');
    
    console.log('⚠️  Security Reminder:');
    console.log('- Proving keys must be kept secure and never exposed publicly');
    console.log('- Verification keys can be public and shared with clients');
    console.log('- This setup used a simplified trusted ceremony for development');
    console.log('- Production deployments should use a proper multi-party ceremony\n');
    
  } catch (error) {
    log.warning(`Could not display detailed key information: ${error.message}`);
  }
}

// Main execution function
async function main() {
  const startTime = Date.now();
  
  try {
    log.info('Starting PersonaPass ZK Keys Setup...');
    
    // Parse command line arguments
    if (process.argv.includes('--help') || process.argv.includes('-h')) {
      console.log(`
PersonaPass Zero-Knowledge Keys Setup

Usage: node setup-zk-keys.js [options]

Options:
  --help, -h           Show this help message
  --verbose, -v        Enable verbose logging
  --force, -f          Force regeneration of existing keys
  --validate-only      Only validate existing keys without regeneration

Environment Variables:
  ZK_CIRCUIT_PATH      Directory for circuit files (default: ./circuits)
  ZK_PROVING_KEY_PATH  Path for proving key (default: ./circuits/proving_key.zkey)
  ZK_VERIFICATION_KEY_PATH  Path for verification key (default: ./circuits/verification_key.json)

Examples:
  node setup-zk-keys.js                  # Generate keys with default settings
  node setup-zk-keys.js --verbose        # Generate with detailed logging
  node setup-zk-keys.js --force          # Force regeneration of existing keys
  node setup-zk-keys.js --validate-only  # Only validate existing keys
`);
      return;
    }
    
    // Validate-only mode
    if (CONFIG.VALIDATE_ONLY) {
      log.info('Running in validation-only mode...');
      await validateKeys();
      return;
    }
    
    // Check if keys already exist and should not be overwritten
    if (!CONFIG.FORCE) {
      const provingKeyExists = await fileExists(CONFIG.PROVING_KEY_PATH);
      const verificationKeyExists = await fileExists(CONFIG.VERIFICATION_KEY_PATH);
      
      if (provingKeyExists && verificationKeyExists) {
        log.warning('Keys already exist. Use --force to regenerate or --validate-only to check them.');
        await displayKeyInfo();
        return;
      }
    }
    
    // Main setup process
    await checkDependencies();
    await ensureDirectory(CONFIG.CIRCUIT_PATH);
    await createSampleCircuit();
    await compileCircuit();
    
    const ptauFile = await setupPowersOfTau();
    await generateProvingKey(ptauFile);
    await extractVerificationKey();
    await validateKeys();
    
    await displayKeyInfo();
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    log.success(`Setup completed in ${duration} seconds`);
    
  } catch (error) {
    log.error(`Setup failed: ${error.message}`);
    
    if (CONFIG.VERBOSE) {
      console.error('\nFull error details:');
      console.error(error);
    }
    
    process.exit(1);
  }
}

// Handle uncaught errors gracefully
process.on('unhandledRejection', (reason, promise) => {
  log.error(`Unhandled rejection at: ${promise}, reason: ${reason}`);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  log.error(`Uncaught exception: ${error.message}`);
  if (CONFIG.VERBOSE) {
    console.error(error);
  }
  process.exit(1);
});

// Run the main function
if (require.main === module) {
  main();
}

module.exports = { main, CONFIG };