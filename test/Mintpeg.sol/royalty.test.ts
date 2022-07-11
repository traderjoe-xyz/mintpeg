import { ethers } from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber, Contract, ContractFactory } from "ethers";
import { MintpegInitProps, initializeMintpeg } from "../utils/helpers"; // eslint-disable-line node/no-missing-import

describe("royalty", () => {
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

  describe("setRoyaltyInfo", () => {
    it("should revert if royalty percent is more than 25% (2500)", async () => {
      await initializeMintpeg(Mintpeg, {}, mintpegInit);

      await expect(
        Mintpeg.connect(dev).setRoyaltyInfo(dev.address, 2501)
      ).to.be.revertedWith("Mintpeg__InvalidRoyaltyInfo()");
    });

    it("should revert if royalty is attempted to be set by an address other than the owner", async () => {
      await initializeMintpeg(Mintpeg, {}, mintpegInit);

      await expect(Mintpeg.connect(alice).setRoyaltyInfo(alice.address, 1000))
        .to.be.reverted;
    });

    it("should emit `RoyaltyInfoChanged` event when royalty is successfuly set", async () => {
      await initializeMintpeg(Mintpeg, {}, mintpegInit);

      await expect(Mintpeg.connect(dev).setRoyaltyInfo(alice.address, 1000))
        .to.emit(Mintpeg, "RoyaltyInfoChanged")
        .withArgs(alice.address, 1000);
    });

    it("should set the royalty information of the contract to the royalty details passed at deployment", async () => {
      await initializeMintpeg(Mintpeg, {}, mintpegInit);
      await Mintpeg.connect(dev).mint(["token0.joepegs.com"]);
      const royaltyDenominator: BigNumber = BigNumber.from("10000"); // default _feeDenominator implemented by openzeppelin ERC2981 contract
      const salePrice: BigNumber = ethers.utils.parseEther("1");
      const royaltyNumerator: BigNumber = BigNumber.from("1000");
      const royaltyFee = salePrice
        .mul(royaltyNumerator)
        .div(royaltyDenominator);

      await Mintpeg.connect(dev).setRoyaltyInfo(
        alice.address,
        royaltyNumerator
      );
      const royaltyInfo: [string, BigNumber] = await Mintpeg.royaltyInfo(
        0,
        salePrice
      );
      expect(royaltyInfo[0]).to.equal(alice.address);
      expect(royaltyInfo[1]).to.equal(royaltyFee);
    });
  });

  describe("setTokenRoyaltyInfo", () => {
    it("should revert if token royalty percent is more than 25% (2500)", async () => {
      await initializeMintpeg(Mintpeg, {}, mintpegInit);
      await Mintpeg.connect(dev).mint(["token0.joepegs.com"]);

      await expect(
        Mintpeg.connect(dev).setTokenRoyaltyInfo(0, dev.address, 2501)
      ).to.be.revertedWith("Mintpeg__InvalidRoyaltyInfo()");
    });

    it("should revert if token royalty is attempted to be set by an address other than the owner", async () => {
      await initializeMintpeg(Mintpeg, {}, mintpegInit);
      await Mintpeg.connect(dev).mint(["token0.joepegs.com"]);

      await expect(
        Mintpeg.connect(alice).setTokenRoyaltyInfo(0, alice.address, 1000)
      ).to.be.reverted;
      await expect(
        Mintpeg.connect(alice).setTokenRoyaltyInfo(0, dev.address, 1000)
      ).to.be.reverted;
    });

    it("should emit `TokenRoyaltyInfoChanged` event when token royalty is successfuly set", async () => {
      await initializeMintpeg(Mintpeg, {}, mintpegInit);
      await Mintpeg.connect(dev).mint(["token0.joepegs.com"]);

      await expect(
        Mintpeg.connect(dev).setTokenRoyaltyInfo(0, alice.address, 1000)
      )
        .to.emit(Mintpeg, "TokenRoyaltyInfoChanged")
        .withArgs(0, alice.address, 1000);
    });

    it("should set the token royalty information of the given tokenId only", async () => {
      await initializeMintpeg(Mintpeg, {}, mintpegInit);
      const tokenURIs: string[] = ["token0.joepegs.com", "token1.joepegs.com"];
      await Mintpeg.connect(dev).mint(tokenURIs);

      const defaultRoyaltyDenominator: BigNumber = BigNumber.from("10000"); // default _feeDenominator implemented by openzeppelin ERC2981 contract
      const salePrice: BigNumber = ethers.utils.parseEther("1");

      const defaultRoyaltyNumerator: BigNumber = BigNumber.from(
        mintpegInit._feePercent
      );
      const defaultRoyaltyFee = salePrice
        .mul(defaultRoyaltyNumerator)
        .div(defaultRoyaltyDenominator);

      const tokenRoyaltyNumerator: BigNumber = BigNumber.from("1000"); // 10% token royalty
      const tokenRoyaltyFee = salePrice
        .mul(tokenRoyaltyNumerator)
        .div(defaultRoyaltyDenominator);

      // set royalty info of individual token
      await Mintpeg.connect(dev).setTokenRoyaltyInfo(
        1,
        alice.address,
        tokenRoyaltyNumerator
      );

      const defaultRoyaltyInfo: [string, BigNumber] = await Mintpeg.royaltyInfo(
        0,
        salePrice
      );
      const tokenRoyaltyInfo: [string, BigNumber] = await Mintpeg.royaltyInfo(
        1,
        salePrice
      );

      expect(defaultRoyaltyInfo[0]).to.equal(dev.address);
      expect(defaultRoyaltyInfo[1]).to.equal(defaultRoyaltyFee);
      expect(tokenRoyaltyInfo[0]).to.equal(alice.address);
      expect(tokenRoyaltyInfo[1]).to.equal(tokenRoyaltyFee);
    });
  });
});
