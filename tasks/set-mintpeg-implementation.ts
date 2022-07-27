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
  const mintpeg = await hre.deployments.get("Mintpeg");
  const mintpegFactory = await hre.deployments.get("MintpegFactory");
  const mintpegFactoryContract = await ethers.getContractAt(
    "MintpegFactory",
    mintpegFactory.address
  );
  const currentMintpegImplementation: string =
    await mintpegFactoryContract.mintpegImplementation();

  if (currentMintpegImplementation === mintpeg.implementation) {
    console.log(
      `-- Mintpeg implmentation already set to ${mintpeg.implementation} --`
    );
  } else {
    const setMintpegImplementationTx =
      await mintpegFactoryContract.setMintpegImplementation(
        mintpeg.implementation ?? ""
      );
    await setMintpegImplementationTx.wait();
    console.log(`-- Mintpeg implmentation set to ${mintpeg.implementation} --`);
  }
});
