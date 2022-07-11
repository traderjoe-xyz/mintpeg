import { ethers } from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract, ContractFactory } from "ethers";
import { MintpegInitProps } from "../index";

describe("mint", () => {
  let dev: SignerWithAddress;
  let alice: SignerWithAddress;
  let Mintpeg: Contract;
  let MintpegCF: ContractFactory;
  let mintpegInit: MintpegInitProps;

  beforeEach(async () => {
    [dev, alice] = await ethers.getSigners();
    MintpegCF = await ethers.getContractFactory("Mintpeg");
    Mintpeg = await MintpegCF.deploy();
    await Mintpeg.deployed();
    mintpegInit = {
      _collectionName: "JoePEG",
      _collectionSymbol: "JPG",
      _royaltyReceiver: dev.address,
      _feePercent: 500,
    };
  });

  const initializeMintpeg = async ({
    _collectionName,
    _collectionSymbol,
    _royaltyReceiver,
    _feePercent,
  }: Partial<MintpegInitProps>) => {
    await Mintpeg.connect(dev).initialize(
      _collectionName || mintpegInit._collectionName,
      _collectionSymbol || mintpegInit._collectionSymbol,
      _royaltyReceiver || mintpegInit._royaltyReceiver,
      _feePercent || mintpegInit._feePercent
    );
  };

  it("should mint a number of tokens equavalent to the length of the tokenURIs passed when called by the contract owner", async () => {
    const tokenURIs: string[] = ["token0.joepegs.com", "token1.joepegs.com"];
    await initializeMintpeg({});
    await Mintpeg.connect(dev).mint(tokenURIs);

    expect(await Mintpeg.balanceOf(dev.address)).to.equal(tokenURIs.length);
    expect(await Mintpeg.tokenURI(0)).to.equal(tokenURIs[0]);
    expect(await Mintpeg.tokenURI(1)).to.equal(tokenURIs[1]);
  });

  it("should revert when an address other than the owner tries to mint new token(s)", async () => {
    const tokenURIs: string[] = ["token0.joepegs.com", "token1.joepegs.com"];
    await initializeMintpeg({});

    await expect(Mintpeg.connect(alice).mint([tokenURIs[0]])).to.be.reverted;
    await expect(Mintpeg.connect(alice).mint(tokenURIs)).to.be.reverted;
  });
});
