import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";
import "hardhat-deploy";
import "hardhat-deploy-ethers";
import glob from "glob";
import path from "path";

glob.sync("./tasks/**/*.ts").forEach(function (file) {
  require(path.resolve(file));
});

module.exports = {
  solidity: "0.8.7",
  networks: {
    hardhat: {},
    fuji: {
      url: "https://api.avax-test.network/ext/bc/C/rpc",
      gasPrice: 26_000_000_000,
      chainId: 43113,
      accounts: process.env.DEPLOY_PRIVATE_KEY
        ? [`0x${process.env.DEPLOY_PRIVATE_KEY}`]
        : [],
    },
    avalanche: {
      url: "https://api.avax.network/ext/bc/C/rpc",
      gasPrice: 26_000_000_000,
      chainId: 43114,
      accounts: process.env.DEPLOY_PRIVATE_KEY
        ? [`0x${process.env.DEPLOY_PRIVATE_KEY}`]
        : [],
    },
    bscTestnet: {
      url: process.env.BNB_RPC_ENDPOINT,
      gasPrice: 20_000_000_000,
      chainId: 97,
      accounts: process.env.BNB_TESTNET_DEPLOYER
        ? [process.env.BNB_TESTNET_DEPLOYER]
        : [],
    },
    bsc: {
      url: process.env.BSC_RPC_ENDPOINT ? process.env.BSC_RPC_ENDPOINT : "",
      gasPrice: 5_000_000_000,
      chainId: 56,
      accounts: process.env.BSC_TESTNET_DEPLOYER
        ? [process.env.BSC_TESTNET_DEPLOYER]
        : [],
    },
  },
  contractSizer: {
    strict: true,
  },
  namedAccounts: {
    deployer: 0,
  },
  etherscan: {
    apiKey: {
      avalanche: process.env.SNOWTRACE_API_KEY,
      avalancheFujiTestnet: process.env.SNOWTRACE_API_KEY,
      bscTestnet: process.env.BNB_API_KEY,
      bsc: process.env.BSC_API_KEY,
    },
  },
};
