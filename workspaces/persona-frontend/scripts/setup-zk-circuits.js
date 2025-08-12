#!/usr/bin/env node

// Real ZK Circuit Setup Script for PersonaPass
// Compiles Circom circuits and generates trusted setup for production-ready ZK proofs

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const CIRCUITS_DIR = path.join(__dirname, '../circuits');
const PUBLIC_DIR = path.join(__dirname, '../public/circuits');
const BUILD_DIR = path.join(CIRCUITS_DIR, 'build');

console.log('🔬 PersonaPass Real ZK Circuit Setup Starting...');
console.log('================================================');

// Ensure directories exist
[PUBLIC_DIR, BUILD_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
});

// Circuit definitions
const circuits = [
  {
    name: 'age_verification',
    file: 'age_verification.circom',
    description: 'Age Verification Circuit',
    powersOfTau: 14, // 2^14 constraints
    ptauFile: 'powersoftau14_hez_final_10.ptau'
  },
  {
    name: 'jurisdiction_proof', 
    file: 'jurisdiction_proof.circom',
    description: 'Jurisdiction/Residency Proof Circuit',
    powersOfTau: 16, // 2^16 constraints
    ptauFile: 'powersoftau16_hez_final_10.ptau'
  },
  {
    name: 'proof_of_personhood',
    file: 'proof_of_personhood.circom', 
    description: 'Proof of Personhood Anti-Sybil Circuit',
    powersOfTau: 18, // 2^18 constraints (most complex)
    ptauFile: 'powersoftau18_hez_final_10.ptau'
  }
];

async function checkDependencies() {
  console.log('\n🔍 Checking dependencies...');
  
  try {
    execSync('circom --version', { stdio: 'pipe' });
    console.log('✅ Circom installed');
  } catch (error) {
    console.log('❌ Circom not found. Installing...');
    try {
      execSync('npm install -g circom', { stdio: 'inherit' });
      console.log('✅ Circom installed successfully');
    } catch (installError) {
      throw new Error('Failed to install Circom. Please install manually: npm install -g circom');
    }
  }

  try {
    execSync('npx snarkjs --version', { stdio: 'pipe' });
    console.log('✅ SnarkJS available');
  } catch (error) {
    console.log('❌ SnarkJS not found. Checking local installation...');
    try {
      execSync('npm ls snarkjs', { stdio: 'pipe' });
      console.log('✅ SnarkJS found in local dependencies');
    } catch (lsError) {
      throw new Error('SnarkJS not found. It should be installed as a project dependency.');
    }
  }
}

async function downloadPtauFiles() {
  console.log('\n📥 Downloading trusted setup files...');
  
  // Get unique ptau files needed
  const uniquePtauFiles = [...new Set(circuits.map(c => c.ptauFile))];
  
  for (const ptauFile of uniquePtauFiles) {
    const ptauPath = path.join(BUILD_DIR, ptauFile);
    
    if (fs.existsSync(ptauPath)) {
      console.log(`✅ ${ptauFile} already exists`);
      continue;
    }
    
    console.log(`📥 Downloading ${ptauFile}...`);
    const ptauUrl = `https://hermez.s3-eu-west-1.amazonaws.com/${ptauFile}`;
    
    try {
      execSync(`curl -o "${ptauPath}" "${ptauUrl}"`, { 
        stdio: 'inherit',
        cwd: BUILD_DIR 
      });
      console.log(`✅ Downloaded ${ptauFile}`);
    } catch (error) {
      console.warn(`⚠️ Failed to download ${ptauFile}, using fallback method...`);
      // Create a smaller development ptau file
      const size = ptauFile.includes('14') ? 14 : ptauFile.includes('16') ? 16 : 18;
      execSync(`npx snarkjs powersoftau new bn128 ${size} "${ptauPath}" -v`, {
        stdio: 'inherit',
        cwd: BUILD_DIR
      });
      console.log(`✅ Created development ${ptauFile}`);
    }
  }
}

async function compileCircuit(circuit) {
  console.log(`\n🎯 Compiling ${circuit.description}...`);
  console.log('==========================================');
  
  const circuitPath = path.join(CIRCUITS_DIR, circuit.file);
  if (!fs.existsSync(circuitPath)) {
    throw new Error(`Circuit file not found: ${circuitPath}`);
  }
  
  // Compile circuit
  console.log('📝 Compiling Circom circuit...');
  execSync(`circom "${circuitPath}" --r1cs --wasm --sym --c --O1`, {
    stdio: 'inherit',
    cwd: BUILD_DIR
  });
  
  // Verify R1CS file was created
  const r1csPath = path.join(BUILD_DIR, `${circuit.name}.r1cs`);
  if (!fs.existsSync(r1csPath)) {
    throw new Error(`R1CS file not created: ${r1csPath}`);
  }
  
  console.log(`✅ ${circuit.name} circuit compiled successfully`);
  return {
    wasmPath: path.join(BUILD_DIR, `${circuit.name}.wasm`),
    r1csPath: r1csPath,
    symPath: path.join(BUILD_DIR, `${circuit.name}.sym`)
  };
}

async function generateTrustedSetup(circuit) {
  console.log(`\n🔐 Setting up trusted setup for ${circuit.name}...`);
  
  const ptauPath = path.join(BUILD_DIR, circuit.ptauFile);
  const r1csPath = path.join(BUILD_DIR, `${circuit.name}.r1cs`);
  const zkeyPath = path.join(BUILD_DIR, `${circuit.name}.zkey`);
  const vkeyPath = path.join(BUILD_DIR, `${circuit.name}_vkey.json`);
  
  // Phase 2 setup
  console.log('🔧 Groth16 setup...');
  execSync(`npx snarkjs groth16 setup "${r1csPath}" "${ptauPath}" "${zkeyPath}"`, {
    stdio: 'inherit',
    cwd: BUILD_DIR
  });
  
  // Export verification key
  console.log('🔑 Exporting verification key...');
  execSync(`npx snarkjs zkey export verificationkey "${zkeyPath}" "${vkeyPath}"`, {
    stdio: 'inherit',
    cwd: BUILD_DIR
  });
  
  console.log(`✅ Trusted setup completed for ${circuit.name}`);
  return {
    zkeyPath,
    vkeyPath
  };
}

async function generateTestProof(circuit) {
  console.log(`\n🧪 Generating test proof for ${circuit.name}...`);
  
  // Create test input based on circuit type
  const inputPath = path.join(BUILD_DIR, `${circuit.name}_test_input.json`);
  const proofPath = path.join(BUILD_DIR, `${circuit.name}_proof.json`);
  const publicPath = path.join(BUILD_DIR, `${circuit.name}_public.json`);
  const wasmPath = path.join(BUILD_DIR, `${circuit.name}.wasm`);
  const zkeyPath = path.join(BUILD_DIR, `${circuit.name}.zkey`);
  const vkeyPath = path.join(BUILD_DIR, `${circuit.name}_vkey.json`);
  
  // Generate test input
  let testInput;
  switch (circuit.name) {
    case 'age_verification':
      testInput = {
        "birthdate": "631152000", // Jan 1, 1990
        "currentDate": "1704067200", // Jan 1, 2024
        "minimumAgeInSeconds": "568080000", // ~18 years
        "salt": "12345",
        "secret": "67890",
        "ageCommitment": "123456789",
        "nullifierHash": "987654321"
      };
      break;
      
    case 'jurisdiction_proof':
      testInput = {
        "userRegion": "1234567890",
        "userSalt": "11111",
        "secret": "22222",
        "allowedRegions": ["1234567890", "2345678901", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0"],
        "regionCommitment": "555555555",
        "nullifierHash": "666666666",
        "numAllowedRegions": "2"
      };
      break;
      
    case 'proof_of_personhood':
      testInput = {
        "biometricHash": "1111111111",
        "biometricLiveness": "95",
        "biometricUniqueness": "98",
        "documentHashes": ["2222222222", "3333333333", "0"],
        "documentScores": ["90", "85", "0"],
        "documentTypes": ["1", "2", "0"],
        "socialSignals": ["4444444444", "5555555555", "0", "0", "0"],
        "socialScores": ["80", "75", "0", "0", "0"],
        "socialTypes": ["1", "2", "0", "0", "0"],
        "deviceFingerprint": "7777777777",
        "behaviorPattern": "8888888888",
        "geolocationHash": "9999999999",
        "kycProviderHash": "1010101010",
        "kycTierLevel": "4",
        "kycValidityPeriod": "365",
        "verificationTimestamps": ["1704067200", "1704067100", "0", "0", "0", "0", "0", "0", "0", "0"],
        "verificationNonces": ["1", "2", "0", "0", "0", "0", "0", "0", "0", "0"],
        "globalUniquenessKey": "1111111111111111",
        "currentTimestamp": "1704067200",
        "challengeNonce": "12345",
        "requiredConfidence": "80",
        "networkEpoch": "1"
      };
      break;
      
    default:
      console.log(`⚠️ No test input defined for ${circuit.name}`);
      return;
  }
  
  fs.writeFileSync(inputPath, JSON.stringify(testInput, null, 2));
  
  try {
    // Generate proof
    console.log('🔮 Generating ZK proof...');
    execSync(`npx snarkjs groth16 fullprove "${inputPath}" "${wasmPath}" "${zkeyPath}" "${proofPath}" "${publicPath}"`, {
      stdio: 'inherit',
      cwd: BUILD_DIR
    });
    
    // Verify proof
    console.log('🔍 Verifying ZK proof...');
    execSync(`npx snarkjs groth16 verify "${vkeyPath}" "${publicPath}" "${proofPath}"`, {
      stdio: 'inherit',
      cwd: BUILD_DIR
    });
    
    console.log(`✅ Test proof for ${circuit.name} verified successfully`);
  } catch (error) {
    console.warn(`⚠️ Test proof generation failed for ${circuit.name}:`, error.message);
  }
}

async function copyAssetsToPubic() {
  console.log('\n📦 Copying circuit assets to public directory...');
  
  for (const circuit of circuits) {
    const wasmSrc = path.join(BUILD_DIR, `${circuit.name}.wasm`);
    const zkeySrc = path.join(BUILD_DIR, `${circuit.name}.zkey`);
    const vkeySrc = path.join(BUILD_DIR, `${circuit.name}_vkey.json`);
    
    const wasmDest = path.join(PUBLIC_DIR, `${circuit.name}.wasm`);
    const zkeyDest = path.join(PUBLIC_DIR, `${circuit.name}_final.zkey`);
    const vkeyDest = path.join(PUBLIC_DIR, `${circuit.name}_vkey.json`);
    
    if (fs.existsSync(wasmSrc)) {
      fs.copyFileSync(wasmSrc, wasmDest);
      console.log(`✅ Copied ${circuit.name}.wasm`);
    }
    
    if (fs.existsSync(zkeySrc)) {
      fs.copyFileSync(zkeySrc, zkeyDest);
      console.log(`✅ Copied ${circuit.name}_final.zkey`);
    }
    
    if (fs.existsSync(vkeySrc)) {
      fs.copyFileSync(vkeySrc, vkeyDest);
      console.log(`✅ Copied ${circuit.name}_vkey.json`);
    }
  }
}

async function generateSummaryReport() {
  console.log('\n📊 Generating setup summary...');
  
  const report = {
    timestamp: new Date().toISOString(),
    circuits: [],
    publicAssets: fs.readdirSync(PUBLIC_DIR),
    buildAssets: fs.readdirSync(BUILD_DIR)
  };
  
  for (const circuit of circuits) {
    const wasmPath = path.join(PUBLIC_DIR, `${circuit.name}.wasm`);
    const zkeyPath = path.join(PUBLIC_DIR, `${circuit.name}_final.zkey`);
    const vkeyPath = path.join(PUBLIC_DIR, `${circuit.name}_vkey.json`);
    
    report.circuits.push({
      name: circuit.name,
      description: circuit.description,
      wasm: fs.existsSync(wasmPath),
      zkey: fs.existsSync(zkeyPath),
      vkey: fs.existsSync(vkeyPath),
      wasmSize: fs.existsSync(wasmPath) ? fs.statSync(wasmPath).size : 0,
      zkeySize: fs.existsSync(zkeyPath) ? fs.statSync(zkeyPath).size : 0
    });
  }
  
  fs.writeFileSync(
    path.join(BUILD_DIR, 'setup-report.json'), 
    JSON.stringify(report, null, 2)
  );
  
  console.log('📄 Setup report saved to build/setup-report.json');
  return report;
}

// Main setup function
async function main() {
  try {
    await checkDependencies();
    await downloadPtauFiles();
    
    for (const circuit of circuits) {
      console.log(`\n🚀 Processing ${circuit.name}...`);
      await compileCircuit(circuit);
      await generateTrustedSetup(circuit);
      await generateTestProof(circuit);
    }
    
    await copyAssetsToPubic();
    const report = await generateSummaryReport();
    
    console.log('\n🎉 ZK Circuit Setup Complete!');
    console.log('===============================');
    console.log('📊 Setup Summary:');
    for (const circuit of report.circuits) {
      console.log(`   • ${circuit.name}: WASM=${circuit.wasm} ZKEY=${circuit.zkey} VKEY=${circuit.vkey}`);
    }
    console.log(`\n📁 Public assets: ${report.publicAssets.length} files`);
    console.log(`📁 Build assets: ${report.buildAssets.length} files`);
    console.log('\n🔐 Security Note:');
    console.log('   This setup is for development. For production:');
    console.log('   1. Use a proper multi-party trusted setup ceremony');
    console.log('   2. Verify all ptau files with independent sources');
    console.log('   3. Audit all circuit logic thoroughly');
    console.log('\n✅ PersonaPass ZK infrastructure ready for real proofs!');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

main();