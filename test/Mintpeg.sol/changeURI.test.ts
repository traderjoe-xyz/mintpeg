import { ethers } from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber, Contract, ContractFactory } from "ethers";
import { MintpegInitProps, initializeMintpeg } from "../utils/helpers";

describe("token URIs", () => {
  let dev: SignerWithAddress;
  let alice: SignerWithAddress;
  let Mintpeg: Contract;
  let MintpegCF: ContractFactory;
  let mintpegInit: MintpegInitProps;
  const tokenURIs: string[] = ["token0.joepegs.com", "token1.joepegs.com"];
  const newTokenURIs: string[] = [
    "new.token0.joepegs.com",
    "new.token1.joepegs.com",
  ];

  beforeEach(async () => {
    [dev, alice] = await ethers.getSigners();
    MintpegCF = await ethers.getContractFactory("Mintpeg");
    Mintpeg = await MintpegCF.deploy();
    await Mintpeg.deployed();
    mintpegInit = {
      _collectionName: "JoePEG",
      _collectionSymbol: "JPG",
      _projectOwner: dev.address,
      _royaltyReceiver: dev.address,
      _feePercent: 500,
    };
  });

  it("should be able to change single token URI", async () => {
    await initializeMintpeg(Mintpeg, {}, mintpegInit);
    await Mintpeg.connect(dev).mint(tokenURIs);
    expect(await Mintpeg.tokenURI(0)).to.be.equal(tokenURIs[0]);
    expect(await Mintpeg.tokenURI(1)).to.be.equal(tokenURIs[1]);

    await Mintpeg.connect(dev).setTokenURI(0, newTokenURIs[0]);

    expect(await Mintpeg.tokenURI(0)).to.be.equal(newTokenURIs[0]);
    expect(await Mintpeg.tokenURI(1)).to.be.equal(tokenURIs[1]);
  });

  it("should be able to change multiple token URIs", async () => {
    await initializeMintpeg(Mintpeg, {}, mintpegInit);
    await Mintpeg.connect(dev).mint(tokenURIs);
    expect(await Mintpeg.tokenURI(0)).to.be.equal(tokenURIs[0]);
    expect(await Mintpeg.tokenURI(1)).to.be.equal(tokenURIs[1]);

    await Mintpeg.connect(dev).setTokenURIs([0, 1], newTokenURIs);

    expect(await Mintpeg.tokenURI(0)).to.be.equal(newTokenURIs[0]);
    expect(await Mintpeg.tokenURI(1)).to.be.equal(newTokenURIs[1]);
  });

  it("token URI should be changable only by Owner", async () => {
    await initializeMintpeg(Mintpeg, {}, mintpegInit);
    await Mintpeg.connect(dev).mint(tokenURIs);
    await Mintpeg.connect(dev).transferFrom(dev.address, alice.address, 0);
    await expect(
      Mintpeg.connect(alice).setTokenURI(0, newTokenURIs[0])
    ).to.be.revertedWith("Ownable: caller is not the owner");
    await expect(
      Mintpeg.connect(alice).setTokenURIs([0, 1], newTokenURIs)
    ).to.be.revertedWith("Ownable: caller is not the owner");

    expect(await Mintpeg.tokenURI(0)).to.be.equal(tokenURIs[0]);
    expect(await Mintpeg.tokenURI(1)).to.be.equal(tokenURIs[1]);
  });

  it("should revert if invalid lengths", async () => {
    await initializeMintpeg(Mintpeg, {}, mintpegInit);
    await Mintpeg.connect(dev).mint(tokenURIs);

    await expect(Mintpeg.connect(dev).setTokenURIs([0], newTokenURIs)).to.be
      .reverted;
    await expect(Mintpeg.connect(dev).setTokenURIs([0, 1], [newTokenURIs[0]]))
      .to.be.reverted;
  });
});
