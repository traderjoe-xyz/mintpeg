/* eslint-disable node/no-missing-import */
import "hardhat/config";
import "dotenv/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "@nomiclabs/hardhat-ethers";
import "hardhat-deploy";
import "hardhat-deploy-ethers";
import "./tasks/deploy-mintpeg";
import "./tasks/set-mintpeg-implementation";

module.exports = {
  solidity: "0.8.7",
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {},
    fuji: {
      url: "https://api.avax-test.network/ext/bc/C/rpc",
      gasPrice: 26000000000,
      chainId: 43113,
      accounts: process.env.DEPLOY_PRIVATE_KEY
        ? [process.env.DEPLOY_PRIVATE_KEY]
        : [],
    },
    avalanche: {
      url: "https://api.avax.network/ext/bc/C/rpc",
      gasPrice: 26000000000,
      chainId: 43114,
      accounts: process.env.DEPLOY_PRIVATE_KEY
        ? [process.env.DEPLOY_PRIVATE_KEY]
        : [],
    },
  },
  namedAccounts: {
    deployer: 0,
  },
  etherscan: {
    apiKey: {
      avalanche: process.env.SNOWTRACE_API_KEY || "",
      avalancheFujiTestnet: process.env.SNOWTRACE_API_KEY || "",
    },
  },
};
