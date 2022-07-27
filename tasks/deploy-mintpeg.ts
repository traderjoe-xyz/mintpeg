import "@nomiclabs/hardhat-ethers";
import "hardhat-deploy";
import "hardhat-deploy-ethers";
import { task } from "hardhat/config";
import { loadLaunchConfig, delay } from "./utils";
import { BigNumber } from "ethers";
import verify from "../scripts/verify";

interface MintpegDeployProps {
  configFilename: string;
}

task("deploy-mintpeg", "Deploys an instance of Mintpeg contract")
  .addParam("configFilename")
  .setAction(async ({ configFilename }: MintpegDeployProps, hre) => {
    console.log("-- Deploying Mintpeg --");

    const ethers = hre.ethers;
    const mintpegFactoryAddress: string = (
      await hre.deployments.get("MintpegFactory")
    ).address;
    const mintpegFactoryContract = await ethers.getContractAt(
      "MintpegFactory",
      mintpegFactoryAddress
    );

    console.log("-- Checking for Mintpeg implementation --");

    const mintpegImplementation: string =
      await mintpegFactoryContract.mintpegImplementation();
    if (mintpegImplementation === ethers.constants.AddressZero) {
      await hre.run("set-mintpeg-implementation");
    }

    const initConfig = loadLaunchConfig(configFilename);
    const creationTx = await mintpegFactoryContract.createMintpeg(
      initConfig.name,
      initConfig.symbol,
      initConfig.royaltyReceiver,
      initConfig.fee
    );
    await creationTx.wait();

    const mintpegNumber: BigNumber =
      await mintpegFactoryContract.getTotalMintpegsCount();
    const deployedMintpegAddress: string =
      await mintpegFactoryContract.allMintpegs(
        mintpegNumber.sub(BigNumber.from(1))
      );

    console.log(`-- Mintpeg deployed at ${deployedMintpegAddress} --`);

    const delayTime = 30;
    console.log(
      `-- Waiting for ${delayTime} seconds for Snowtrace to index Mintpeg Contract --`
    );
    await delay(delayTime);
    await verify(
      hre,
      "contracts/Mintpeg.sol:Mintpeg",
      deployedMintpegAddress,
      []
    );
  });
