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
      gasPrice: 26000000000,
      chainId: 43113,
      accounts: process.env.DEPLOY_PRIVATE_KEY
        ? [`0x${process.env.DEPLOY_PRIVATE_KEY}`]
        : [],
    },
    avalanche: {
      url: "https://api.avax.network/ext/bc/C/rpc",
      gasPrice: 26000000000,
      chainId: 43114,
      accounts: process.env.DEPLOY_PRIVATE_KEY
        ? [`0x${process.env.DEPLOY_PRIVATE_KEY}`]
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
    apiKey: process.env.SNOWTRACE_API_KEY ?? "",
  },
};
