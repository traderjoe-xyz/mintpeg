import { ethers } from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber, Contract, ContractFactory } from "ethers";
import { MintpegInitProps } from "../index";

describe("initialize", () => {
  let dev: SignerWithAddress;
  let Mintpeg: Contract;
  let MintpegCF: ContractFactory;
  let mintpegInit: MintpegInitProps;

  beforeEach(async () => {
    [dev] = await ethers.getSigners();
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

  it("should set the owner of the contract to the deployer", async () => {
    await initializeMintpeg({});
    expect(await Mintpeg.owner()).to.equal(dev.address);
  });

  it("should set the name of the contract to the collection name passed at deployment", async () => {
    await initializeMintpeg({});
    expect(await Mintpeg.name()).to.equal(mintpegInit._collectionName);
  });

  it("should set the symbol of the contract to the collection symbol passed at deployment", async () => {
    await initializeMintpeg({});
    expect(await Mintpeg.symbol()).to.equal(mintpegInit._collectionSymbol);
  });

  it("should set the royalty information of the contract to the royalty details passed at deployment", async () => {
    await initializeMintpeg({});
    await Mintpeg.connect(dev).mint(["token0.joepegs.com"]);
    const royaltyDenominator: BigNumber = BigNumber.from("10000"); // default _feeDenominator implemented by openzeppelin ERC2981 contract
    const salePrice: BigNumber = ethers.utils.parseEther("1");
    const royaltyNumerator: BigNumber = BigNumber.from(mintpegInit._feePercent);
    const royaltyFee = salePrice.mul(royaltyNumerator).div(royaltyDenominator);
    const royaltyInfo: [string, BigNumber] = await Mintpeg.royaltyInfo(
      0,
      salePrice
    );

    expect(royaltyInfo[0]).to.equal(dev.address);
    expect(royaltyInfo[1]).to.equal(royaltyFee);
  });

  it("should revert if royalty percent is more than 25% (2500)", async () => {
    await expect(initializeMintpeg({ _feePercent: 2501 })).to.be.revertedWith(
      "Mintpeg__InvalidRoyaltyInfo()"
    );
  });

  it("should emit `InitializedMintpeg` event with the deployment information", async () => {
    await expect(
      Mintpeg.connect(dev).initialize(
        mintpegInit._collectionName,
        mintpegInit._collectionSymbol,
        mintpegInit._royaltyReceiver,
        mintpegInit._feePercent
      )
    )
      .to.emit(Mintpeg, "InitializedMintpeg")
      .withArgs(
        mintpegInit._collectionName,
        mintpegInit._collectionSymbol,
        dev.address,
        mintpegInit._royaltyReceiver,
        mintpegInit._feePercent
      );
  });

  it("should emit `RoyaltyInfoChanged` event with the royalty information passed at deployment", async () => {
    await expect(
      Mintpeg.connect(dev).initialize(
        mintpegInit._collectionName,
        mintpegInit._collectionSymbol,
        mintpegInit._royaltyReceiver,
        mintpegInit._feePercent
      )
    )
      .to.emit(Mintpeg, "RoyaltyInfoChanged")
      .withArgs(mintpegInit._royaltyReceiver, mintpegInit._feePercent);
  });
});
