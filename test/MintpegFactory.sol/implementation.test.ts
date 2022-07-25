import { ethers } from "hardhat";
import { expect } from "chai";
import { Contract, ContractFactory } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("setMintpegImplementation", () => {
  let Mintpeg: Contract;
  let MintpegCF: ContractFactory;
  let MintpegFactory: Contract;
  let MintpegFactoryCF: ContractFactory;
  let dev: SignerWithAddress;
  let alice: SignerWithAddress;

  beforeEach(async () => {
    MintpegCF = await ethers.getContractFactory("Mintpeg");
    Mintpeg = await MintpegCF.deploy();
    await Mintpeg.deployed();

    MintpegFactoryCF = await ethers.getContractFactory("MintpegFactory");
    MintpegFactory = await MintpegFactoryCF.deploy();
    await MintpegFactory.deployed();

    [dev, alice] = await ethers.getSigners();
  });

  it("should revert when mintpegImplementation is set to a null address", async () => {
    await expect(
      MintpegFactory.connect(dev).setMintpegImplementation(
        ethers.constants.AddressZero
      )
    ).to.be.reverted;
  });

  it("should revert when setMintpegImplementation is called by an address other than the owner", async () => {
    await expect(
      MintpegFactory.connect(alice).setMintpegImplementation(Mintpeg.address)
    ).to.be.reverted;
  });

  it("should set mintpegImplementation to the address passed to function", async () => {
    await MintpegFactory.connect(dev).setMintpegImplementation(Mintpeg.address);

    expect(await MintpegFactory.mintpegImplementation()).to.equal(
      Mintpeg.address
    );
  });

  it("should emit `SetMintpegImplementation` when mintpegImplementation is set", async () => {
    await expect(
      MintpegFactory.connect(dev).setMintpegImplementation(Mintpeg.address)
    )
      .to.emit(MintpegFactory, "SetMintpegImplementation")
      .withArgs(Mintpeg.address);
  });
});
