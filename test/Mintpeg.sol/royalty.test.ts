import { ethers } from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber, Contract, ContractFactory } from "ethers";
import { MintpegInitProps } from "../index";

describe("setRoyaltyInfo", () => {
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

  it("should revert if royalty percent is more than 25% (2500)", async () => {
    await initializeMintpeg({});

    await expect(
      Mintpeg.connect(dev).setRoyaltyInfo(dev.address, 2501)
    ).to.be.revertedWith("Mintpeg__InvalidRoyaltyInfo()");
  });

  it("should revert if royalty is attempted to be set by an address other than the owner", async () => {
    await initializeMintpeg({});

    await expect(Mintpeg.connect(alice).setRoyaltyInfo(alice.address, 1000)).to
      .be.reverted;
  });

  it("should emit `RoyaltyInfoChanged` event when royalty is successfuly set", async () => {
    await initializeMintpeg({});

    await expect(Mintpeg.connect(dev).setRoyaltyInfo(alice.address, 1000))
      .to.emit(Mintpeg, "RoyaltyInfoChanged")
      .withArgs(alice.address, 1000);
  });

  it("should set the royalty information of the contract to the royalty details passed at deployment", async () => {
    await initializeMintpeg({});
    await Mintpeg.connect(dev).mint(["token0.joepegs.com"]);
    const royaltyDenominator: BigNumber = BigNumber.from("10000"); // default _feeDenominator implemented by openzeppelin ERC2981 contract
    const salePrice: BigNumber = ethers.utils.parseEther("1");
    const royaltyNumerator: BigNumber = BigNumber.from("1000");
    const royaltyFee = salePrice.mul(royaltyNumerator).div(royaltyDenominator);

    await Mintpeg.connect(dev).setRoyaltyInfo(alice.address, royaltyNumerator);
    const royaltyInfo: [string, BigNumber] = await Mintpeg.royaltyInfo(
      0,
      salePrice
    );
    expect(royaltyInfo[0]).to.equal(alice.address);
    expect(royaltyInfo[1]).to.equal(royaltyFee);
  });
});
