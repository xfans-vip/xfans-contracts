require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-etherscan");
require("dotenv").config();

// The next line is part of the sample project, you don't need it in your
// project. It imports a Hardhat task definition, that can be used for
// testing the frontend.
// require("./tasks/faucet");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.15",
    settings: { 
      optimizer: {
        enabled: true,
        runs: 2_000,
      },
      metadata: {
        bytecodeHash: 'none',
      },
    },
  },
  networks: {
    // rinkeby: {
    //   url: "...",
    //   accounts: {
    //     mnemonic: "test test test test test test test test test test test junk",
    //     path: "m/44'/60'/0'/0",
    //     initialIndex: 0,
    //     count: 20,
    //     passphrase: "",
    //   },
    // },
    hardhat: {
      chainId: 1337, // We set 1337 to make interacting with MetaMask simpler
      WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", //
      USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", //
      USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7", //
      PRICE_FEE_ETHUSD: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419", //
      forking: {
        url: process.env.ETH_URL,
        blockNumber: 15936431
      },
    },
    localhost: {
      chainId: 1337, // We set 1337 to make interacting with MetaMask simpler
      WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", //
      USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", //
      USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7", //
      PRICE_FEE_ETHUSD: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419", 
      forking: {
        url: process.env.GOERLI_URL,
        // blockNumber: 15936430
      },
    },
    goerli: {
      url: process.env.GOERLI_URL,
      accounts: [process.env.PRIVATE_KEY],
      WETH: "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6", //
      USDC: "0xD87Ba7A50B2E7E660f678A895E4B72E7CB4CCd9C", //
      USDT: "0xD87Ba7A50B2E7E660f678A895E4B72E7CB4CCd9C", //
      PRICE_FEE_ETHUSD: "0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e"
    },
    arbgoerli: {
      url: process.env.ARB_GOERLI_URL,
      accounts: [process.env.PRIVATE_KEY],
      WETH: "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6", //
      USDC: "0xD87Ba7A50B2E7E660f678A895E4B72E7CB4CCd9C", //
      USDT: "0xD87Ba7A50B2E7E660f678A895E4B72E7CB4CCd9C", 
      PRICE_FEE_ETHUSD: "0x62CAe0FA2da220f43a51F86Db2EDb36DcA9A5A08"
    },
    arbitrum: {
      url: process.env.ARBONE_URL,
      accounts: [process.env.PRIVATE_KEY_ARBONE],
      WETH: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", //
      USDC: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8", //
      USDT: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", //
      PRICE_FEE_ETHUSD: "0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612"
    },
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: process.env.ARBISCAN_APIKEY
  },
  arbiscan: {
    // Your API key for arbiscan
    // Obtain one at https://arbiscan.io/
    apiKey: process.env.ARBISCAN_APIKEY
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

// npx hardhat run scripts/deploy.js --network localhost

//arbiscan/etherscan verify
// npx hardhat verify --network mainnet DEPLOYED_CONTRACT_ADDRESS "Constructor argument 1"
// npx hardhat verify --network arbitrum 0x4Fe08Af398049E49D21752e78c3Eacf10Ec8B1df
// npx hardhat verify --network arbitrum 0xefAB47f5aD6f7D0E4f08e8ae1eA6fba214de42F6 "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1"