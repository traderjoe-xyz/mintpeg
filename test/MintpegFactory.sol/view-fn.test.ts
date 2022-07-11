import { ethers } from "hardhat";
import { expect } from "chai";
import { Contract, ContractFactory } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { MintpegInitProps } from "../index"; // eslint-disable-line node/no-missing-import

describe("view functions", () => {
  let Mintpeg: Contract;
  let MintpegCF: ContractFactory;
  let MintpegFactory: Contract;
  let MintpegFactoryCF: ContractFactory;
  let dev: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let charlie: SignerWithAddress;
  let mintpegInit: MintpegInitProps;

  beforeEach(async () => {
    MintpegCF = await ethers.getContractFactory("Mintpeg");
    Mintpeg = await MintpegCF.deploy();
    await Mintpeg.deployed();

    MintpegFactoryCF = await ethers.getContractFactory("MintpegFactory");
    MintpegFactory = await MintpegFactoryCF.deploy();
    await MintpegFactory.deployed();

    [dev, alice, bob, charlie] = await ethers.getSigners();
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

  describe("getNumberOfMintpegsCreated", () => {
    it("should return the number of mintpegs created by an address", async () => {
      await setMintpegImplementation(Mintpeg.address);

      await createMintpeg({}, dev);
      expect(
        await MintpegFactory.getNumberOfMintpegsCreated(dev.address)
      ).to.equal(1);

      await createMintpeg({}, alice);
      await createMintpeg({}, alice);
      expect(
        await MintpegFactory.getNumberOfMintpegsCreated(alice.address)
      ).to.equal(2);

      await createMintpeg({}, bob);
      await createMintpeg({}, bob);
      await createMintpeg({}, bob);
      expect(
        await MintpegFactory.getNumberOfMintpegsCreated(bob.address)
      ).to.equal(3);

      expect(
        await MintpegFactory.getNumberOfMintpegsCreated(charlie.address)
      ).to.equal(0);
    });
  });

  describe("getTotalMintpegsCount", () => {
    it("should return the total number of mintpegs deployed by MintpegFactory contract", async () => {
      await setMintpegImplementation(Mintpeg.address);

      await createMintpeg({}, dev);
      expect(await MintpegFactory.getTotalMintpegsCount()).to.equal(1);

      await createMintpeg({}, alice);
      await createMintpeg({}, alice);
      expect(await MintpegFactory.getTotalMintpegsCount()).to.equal(3);
    });
  });

  describe("getMintpegImplementation", () => {
    it("should return the address of the base mintpegImplementation", async () => {
      // note the mintpeg implementation is null address before being set
      expect(await MintpegFactory.getMintpegImplementation()).to.equal(
        ethers.constants.AddressZero
      );

      await setMintpegImplementation(Mintpeg.address);
      expect(await MintpegFactory.getMintpegImplementation()).to.equal(
        Mintpeg.address
      );
    });
  });

  describe("getMintpegCreatedAtIndex", () => {
    it("should revert if deployer address has not created Mintpeg contracts up to the given index", async () => {
      await setMintpegImplementation(Mintpeg.address);
      await createMintpeg({}, dev);
      await createMintpeg({}, dev);

      await expect(MintpegFactory.getMintpegCreatedAtIndex(dev.address, 2)).to
        .be.reverted;
    });

    it("should return the address of Mintpeg contract deployed at the given index", async () => {
      await setMintpegImplementation(Mintpeg.address);

      // note that bob created contracts at index `1` and `3`
      await createMintpeg({}, alice);
      await createMintpeg({}, bob);
      await createMintpeg({}, charlie);
      await createMintpeg({}, bob);

      expect(await MintpegFactory.allMintpegs(1)).to.equal(
        await MintpegFactory.getMintpegCreatedAtIndex(bob.address, 0)
      );
      expect(await MintpegFactory.allMintpegs(3)).to.equal(
        await MintpegFactory.getMintpegCreatedAtIndex(bob.address, 1)
      );
    });
  });
});
