/* eslint-disable node/no-missing-import */
/* eslint-disable node/no-unpublished-import */
import { HardhatRuntimeEnvironment } from "hardhat/types";
import verify from "../scripts/verify";

async function main(hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();

  const mintpegContract = await deploy("Mintpeg", {
    from: deployer,
    args: [],
    proxy: {
      proxyContract: "OpenZeppelinTransparentProxy",
      execute: {
        init: {
          methodName: "initialize",
          args: ["Joepegs", "JOEPEGS", deployer, 500],
        },
      },
    },
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
  });

  await verify(
    hre,
    "contracts/Mintpeg.sol:Mintpeg",
    mintpegContract.implementation,
    []
  );
}
module.exports = main;
module.exports.tags = ["Mintpeg"];
