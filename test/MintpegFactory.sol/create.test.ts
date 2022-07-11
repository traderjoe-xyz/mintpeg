import { ethers } from "hardhat";
import { expect } from "chai";
import { Contract, ContractFactory } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { MintpegInitProps } from "../index"; // eslint-disable-line node/no-missing-import

describe("createMintpeg", () => {
  let Mintpeg: Contract;
  let MintpegCF: ContractFactory;
  let MintpegFactory: Contract;
  let MintpegFactoryCF: ContractFactory;
  let dev: SignerWithAddress;
  let alice: SignerWithAddress;
  let mintpegInit: MintpegInitProps;

  beforeEach(async () => {
    MintpegCF = await ethers.getContractFactory("Mintpeg");
    Mintpeg = await MintpegCF.deploy();
    await Mintpeg.deployed();

    MintpegFactoryCF = await ethers.getContractFactory("MintpegFactory");
    MintpegFactory = await MintpegFactoryCF.deploy();
    await MintpegFactory.deployed();

    [dev, alice] = await ethers.getSigners();
    mintpegInit = {
      _collectionName: "JoePEG",
      _collectionSymbol: "JPG",
      _royaltyReceiver: dev.address,
      _feePercent: 500,
    };
  });

  const setMintpegImplementation = async (
    mintpegImplementation: string
  ): Promise<void> => {
    await MintpegFactory.connect(dev).setMintpegImplementation(
      mintpegImplementation
    );
  };

  const createMintpeg = async (
    {
      _collectionName,
      _collectionSymbol,
      _royaltyReceiver,
      _feePercent,
    }: Partial<MintpegInitProps>,
    deployer: SignerWithAddress
  ): Promise<void> => {
    await MintpegFactory.connect(deployer).createMintpeg(
      _collectionName || mintpegInit._collectionName,
      _collectionSymbol || mintpegInit._collectionSymbol,
      _royaltyReceiver || mintpegInit._royaltyReceiver,
      _feePercent || mintpegInit._feePercent
    );
  };

  it("should revert when mintpegImplementation is a null address", async () => {
    await expect(
      MintpegFactory.connect(dev).createMintpeg(
        mintpegInit._collectionName,
        mintpegInit._collectionSymbol,
        mintpegInit._royaltyReceiver,
        mintpegInit._feePercent
      )
    ).to.be.revertedWith("MintpegFactory__InvalidMintpegImplementation()");
  });

  it("should add the address of created Mintpeg to allMintpegs array", async () => {
    await setMintpegImplementation(Mintpeg.address);
    await expect(MintpegFactory.allMintpegs(0)).to.be.reverted; // affirm allMintpegs array is empty

    await createMintpeg({}, alice);
    const createdMintpegAddress: string = await MintpegFactory.allMintpegs(0);

    expect(createdMintpegAddress).to.not.equal(ethers.constants.AddressZero);
    expect(createdMintpegAddress).to.not.equal(undefined);
  });

  it("should add the address of created Mintpeg to array of created Mintpegs by the message's sender", async () => {
    await setMintpegImplementation(Mintpeg.address);
    await createMintpeg({}, dev);
    await createMintpeg({}, alice);
    await createMintpeg({}, alice);

    expect(
      await MintpegFactory.getNumberOfMintpegsCreated(dev.address)
    ).to.equal(1);
    expect(
      await MintpegFactory.getNumberOfMintpegsCreated(alice.address)
    ).to.equal(2);
  });

  it("should emit `MintpegCreated` event when Mintpeg is created", async () => {
    await setMintpegImplementation(Mintpeg.address);

    await expect(
      MintpegFactory.connect(alice).createMintpeg(
        mintpegInit._collectionName,
        mintpegInit._collectionSymbol,
        mintpegInit._royaltyReceiver,
        mintpegInit._feePercent
      )
    ).to.emit(MintpegFactory, "MintpegCreated");
    // wasn't tested with `.withArgs` cause the address of the mintpeg created cannot be gotten synchronously.
  });
});
