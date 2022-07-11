import { ethers } from "hardhat";
import { expect } from "chai";
import { Contract, ContractFactory } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  MintpegInitProps,
  createMintpeg,
  setMintpegImplementation,
} from "../utils/helpers"; // eslint-disable-line node/no-missing-import

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

  describe("getNumberOfMintpegsCreated", () => {
    it("should return the number of mintpegs created by an address", async () => {
      await setMintpegImplementation(MintpegFactory, Mintpeg.address);
      await createMintpeg(MintpegFactory, {}, mintpegInit, dev);
      expect(
        await MintpegFactory.getNumberOfMintpegsCreated(dev.address)
      ).to.equal(1);

      await createMintpeg(MintpegFactory, {}, mintpegInit, alice);
      await createMintpeg(MintpegFactory, {}, mintpegInit, alice);
      expect(
        await MintpegFactory.getNumberOfMintpegsCreated(alice.address)
      ).to.equal(2);

      await createMintpeg(MintpegFactory, {}, mintpegInit, bob);
      await createMintpeg(MintpegFactory, {}, mintpegInit, bob);
      await createMintpeg(MintpegFactory, {}, mintpegInit, bob);
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
      await setMintpegImplementation(MintpegFactory, Mintpeg.address);

      await createMintpeg(MintpegFactory, {}, mintpegInit, dev);
      expect(await MintpegFactory.getTotalMintpegsCount()).to.equal(1);

      await createMintpeg(MintpegFactory, {}, mintpegInit, alice);
      await createMintpeg(MintpegFactory, {}, mintpegInit, alice);
      expect(await MintpegFactory.getTotalMintpegsCount()).to.equal(3);
    });
  });

  describe("getMintpegCreatedAtIndex", () => {
    it("should revert if deployer address has not created Mintpeg contracts up to the given index", async () => {
      await setMintpegImplementation(MintpegFactory, Mintpeg.address);
      await createMintpeg(MintpegFactory, {}, mintpegInit, dev);
      await createMintpeg(MintpegFactory, {}, mintpegInit, dev);

      await expect(MintpegFactory.getMintpegCreatedAtIndex(dev.address, 2)).to
        .be.reverted;
    });

    it("should return the address of Mintpeg contract deployed at the given index", async () => {
      await setMintpegImplementation(MintpegFactory, Mintpeg.address);

      // note that bob created contracts at index `1` and `3`
      await createMintpeg(MintpegFactory, {}, mintpegInit, alice);
      await createMintpeg(MintpegFactory, {}, mintpegInit, bob);
      await createMintpeg(MintpegFactory, {}, mintpegInit, charlie);
      await createMintpeg(MintpegFactory, {}, mintpegInit, bob);

      expect(await MintpegFactory.allMintpegs(1)).to.equal(
        await MintpegFactory.getMintpegCreatedAtIndex(bob.address, 0)
      );
      expect(await MintpegFactory.allMintpegs(3)).to.equal(
        await MintpegFactory.getMintpegCreatedAtIndex(bob.address, 1)
      );
    });
  });
});
