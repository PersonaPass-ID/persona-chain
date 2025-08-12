
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
