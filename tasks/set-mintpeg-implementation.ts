/* eslint-disable node/no-missing-import */
/* eslint-disable node/no-unpublished-import */
import "@nomiclabs/hardhat-ethers";
import "hardhat-deploy";
import "hardhat-deploy-ethers";
import { task } from "hardhat/config";

task(
  "set-mintpeg-implementation",
  "Sets a base mintpeg implementation in MintpegFactory contract"
).setAction(async (taskArguments, hre) => {
  console.log("-- Setting Mintpeg implmentation --");

  const ethers = hre.ethers;
  const baseMintpegAddress: string = (await hre.deployments.get("Mintpeg"))
    .address;
  const mintpegFactoryAddress: string = (
    await hre.deployments.get("MintpegFactory")
  ).address;
  const factory = await ethers.getContractAt(
    "MintpegFactory",
    mintpegFactoryAddress
  );

  const setMintpegImplementationTx = await factory.setMintpegImplementation(
    baseMintpegAddress
  );
  await setMintpegImplementationTx.wait();
});
