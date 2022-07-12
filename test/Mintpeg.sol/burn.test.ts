import { ethers } from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber, Contract, ContractFactory } from "ethers";
import { MintpegInitProps, initializeMintpeg } from "../utils/helpers"; // eslint-disable-line node/no-missing-import

describe("burn", () => {
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

  it("should revert if tokenId is not owned by function's caller", async () => {
    await initializeMintpeg(Mintpeg, {}, mintpegInit);
    await Mintpeg.connect(dev).mint([
      "token0.joepegs.com",
      "token0.joepegs.com",
    ]);
    await Mintpeg.connect(dev).transferFrom(dev.address, alice.address, 0);

    await expect(Mintpeg.connect(dev).burn(0)).to.be.revertedWith(
      "Mintpeg__InvalidTokenOwner"
    );
    await expect(Mintpeg.connect(alice).burn(1)).to.be.revertedWith(
      "Mintpeg__InvalidTokenOwner"
    );
  });

  it("should reset the royalty informaton of the burned tokenId to the global default", async () => {
    await initializeMintpeg(Mintpeg, {}, mintpegInit);
    await Mintpeg.connect(dev).mint(["token0.joepegs.com"]);
    await Mintpeg.connect(dev).setTokenRoyaltyInfo(0, dev.address, 1000); // set individual token royalty
    await Mintpeg.connect(dev).burn(0);

    const defaultRoyaltyDenominator: BigNumber = BigNumber.from("10000"); // default _feeDenominator implemented by openzeppelin ERC2981 contract
    const salePrice: BigNumber = ethers.utils.parseEther("1");
    const defaultRoyaltyNumerator: BigNumber = BigNumber.from(
      mintpegInit._feePercent
    );
    const defaultRoyaltyFee = salePrice
      .mul(defaultRoyaltyNumerator)
      .div(defaultRoyaltyDenominator);
    const royaltyInfo: [string, BigNumber] = await Mintpeg.royaltyInfo(
      0,
      salePrice
    );

    expect(royaltyInfo[1]).to.equal(defaultRoyaltyFee);
  });

  it("should reduce the number of tokens owned by function caller by 1", async () => {
    const tokenURIs: string[] = ["token0.joepegs.com", "token1.joepegs.com"];
    await initializeMintpeg(Mintpeg, {}, mintpegInit);
    await Mintpeg.connect(dev).mint(tokenURIs);
    await Mintpeg.connect(dev).burn(0);

    expect(await Mintpeg.balanceOf(dev.address)).to.equal(tokenURIs.length - 1);
  });
});
