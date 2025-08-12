/**
 * Compile only the PersonaTokenomics contract for deployment
 */

const { execSync } = require('child_process');
const path = require('path');

async function compileTokenContract() {
  console.log('🔧 Compiling PersonaTokenomics contract...');
  
  try {
    // Create a temporary hardhat config that only compiles our token
    const tempConfig = `
const { HardhatUserConfig } = require("hardhat/config");
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const config = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  paths: {
    sources: "./contracts/tokenomics",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  }
};

module.exports = config;
`;

    // Write temporary config
    const fs = require('fs');
    const configPath = path.join(__dirname, '../hardhat.temp.config.js');
    fs.writeFileSync(configPath, tempConfig);
    
    // Compile using temporary config
    execSync(`npx hardhat compile --config ${configPath}`, { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    
    // Clean up
    fs.unlinkSync(configPath);
    
    console.log('✅ PersonaTokenomics contract compiled successfully!');
    
  } catch (error) {
    console.error('❌ Compilation failed:', error.message);
    process.exit(1);
  }
}

compileTokenContract();