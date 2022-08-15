import "@nomiclabs/hardhat-ethers";
import "hardhat-deploy";
import "hardhat-deploy-ethers";
import BatchTransferNFT from "./ABI/BatchTransferNFT.json";
import { task } from "hardhat/config";

interface MintpegDeployProps {
  configFilename: string | undefined;
}

const MAX_MINT_PER_TX = 60;
const MAX_TRANSFER_PER_TX = 120;

const BATCHTRANSFER_ADDRESSES = new Map();
BATCHTRANSFER_ADDRESSES.set("43114", "0xe0ad9Fab889C32Bb52C547Bc8deAa98f9df04C87");
BATCHTRANSFER_ADDRESSES.set("43113", "0x43C2d5387547fb6A7FA3E62aFA431505A01E0fef");

task(
  "airdrop-single-item",
  "Deploys an instance of Mintpeg contract and airdrops it to specified users"
)
  .addOptionalParam("configFilename")
  .setAction(async ({ configFilename }: MintpegDeployProps, hre) => {
    const { deployedMintpegAddress, initConfig } = await hre.run("deploy-mintpeg", {
      configFilename: configFilename,
    });

    const chainId = await hre.getChainId();
    const mintpeg = await hre.ethers.getContractAt("Mintpeg", deployedMintpegAddress);
    const batchTransfer = await hre.ethers.getContractAt(
      BatchTransferNFT.abi,
      BATCHTRANSFER_ADDRESSES.get(chainId)
    );

    const airdropAddresses: string[] = initConfig.airdrop;
    const airdropAmount = airdropAddresses.length;
    const tokenURIs = Array.from({ length: airdropAmount }).map(() => initConfig.metadataURL);
    const airdrop = airdropAddresses.map((address, index) => [mintpeg.address, address, index, 0]);

    console.log(`-- Minting ${airdropAmount} NFTs --`);

    // Mint the NFTS needed
    const mintSteps =
      Math.floor(airdropAmount / MAX_MINT_PER_TX) + (airdropAmount % MAX_MINT_PER_TX === 0 ? 0 : 1);

    for (let i = 0; i < mintSteps; i++) {
      const mintTx = await mintpeg.mint(
        tokenURIs.slice(i * MAX_MINT_PER_TX, (i + 1) * MAX_MINT_PER_TX)
      );
      mintTx.wait();
    }

    // BatchTransfer contrat approval
    const approveTx = await mintpeg.setApprovalForAll(batchTransfer.address, true);
    approveTx.wait();

    console.log(`-- Sending ${airdropAmount} NFTs to the specified accounts --`);

    // Transfer to the specified addresses
    const transferSteps =
      Math.floor(airdropAmount / MAX_TRANSFER_PER_TX) +
      (airdropAmount % MAX_TRANSFER_PER_TX === 0 ? 0 : 1);

    for (let i = 0; i < transferSteps; i++) {
      const transferTx = await batchTransfer.batchTransfer(
        airdrop.slice(i * MAX_TRANSFER_PER_TX, (i + 1) * MAX_TRANSFER_PER_TX)
      );

      transferTx.wait();
    }

    // Removing approval for extra safety
    const unapproveTx = await mintpeg.setApprovalForAll(batchTransfer.address, false);
    unapproveTx.wait();
  });
