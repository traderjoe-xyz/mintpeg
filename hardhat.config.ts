import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";
import "hardhat-deploy";
import "hardhat-deploy-ethers";
import "./tasks/deploy-mintpeg";
import "./tasks/set-mintpeg-implementation";
import "./tasks/mint-collection-items";

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
