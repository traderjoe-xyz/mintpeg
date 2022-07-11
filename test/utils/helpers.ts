import { ethers } from "hardhat";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

export interface MintpegInitProps {
  _collectionName: string;
  _collectionSymbol: string;
  _royaltyReceiver: string;
  _feePercent: number;
}

export const initializeMintpeg = async (
  mintpeg: Contract,
  config: Partial<MintpegInitProps>,
  baseConfig: MintpegInitProps
) => {
  const [dev] = await ethers.getSigners();
  await mintpeg
    .connect(dev)
    .initialize(
      config._collectionName || baseConfig._collectionName,
      config._collectionSymbol || baseConfig._collectionSymbol,
      config._royaltyReceiver || baseConfig._royaltyReceiver,
      config._feePercent || baseConfig._feePercent
    );
};

export const setMintpegImplementation = async (
  mintpegFactory: Contract,
  mintpegImplementation: string
): Promise<void> => {
  const [dev] = await ethers.getSigners();
  await mintpegFactory
    .connect(dev)
    .setMintpegImplementation(mintpegImplementation);
};

export const createMintpeg = async (
  mintpegFactory: Contract,
  config: Partial<MintpegInitProps>,
  baseConfig: MintpegInitProps,
  deployer: SignerWithAddress
): Promise<void> => {
  await mintpegFactory
    .connect(deployer)
    .createMintpeg(
      config._collectionName || baseConfig._collectionName,
      config._collectionSymbol || baseConfig._collectionSymbol,
      config._royaltyReceiver || baseConfig._royaltyReceiver,
      config._feePercent || baseConfig._feePercent
    );
};
