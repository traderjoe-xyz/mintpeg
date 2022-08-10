import { task } from "hardhat/config";

interface TransferOwnershipProps {
  mintpegAddress: string;
  newOwner: string;
}

task("transfer-ownership", "Transfers the ownership of a Mintpeg contract")
  .addParam("mintpegAddress", "Address of the Mintpeg contract")
  .addParam("newOwner", "Address to transfer ownership of Mintpeg contract to")
  .setAction(
    async ({ mintpegAddress, newOwner }: TransferOwnershipProps, hre) => {
      const { ethers } = hre;
      const Mintpeg = await ethers.getContractAt(
        "Mintpeg",
        mintpegAddress
      );
      const transferOwnershipTx = await Mintpeg.transferOwnership(newOwner);
      transferOwnershipTx.wait();

      console.log(
        `-- Ownership of Mintpeg at ${mintpegAddress} transferred to ${newOwner} --`
      );
    }
  );
