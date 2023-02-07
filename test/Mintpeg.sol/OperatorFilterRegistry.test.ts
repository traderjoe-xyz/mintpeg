import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { Contract, ContractFactory } from "ethers";
import { config as hardhatConfig, ethers, network } from "hardhat";

describe("OperatorFilterRegistry", function () {
  let mintpegCF: ContractFactory;
  let mintpeg: Contract;
  let filterRegistry: Contract;
  let osOwnedRegistrant: Contract;

  let signers: SignerWithAddress[];
  let dev: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let royaltyReceiver: SignerWithAddress;
  let registrantOwner: SignerWithAddress;

  const abi = ethers.utils.defaultAbiCoder;

  const deployFixture = async () => {
    const rpcConfig: any = hardhatConfig.networks.avalanche;
    await network.provider.request({
      method: "hardhat_reset",
      params: [
        {
          forking: {
            jsonRpcUrl: rpcConfig.url,
          },
          live: false,
          saveDeployments: true,
          tags: ["test", "local"],
        },
      ],
    });

    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [await osOwnedRegistrant.owner()],
    });

    await network.provider.send("hardhat_setBalance", [
      await osOwnedRegistrant.owner(),
      "0x100000000000000000000000",
    ]);

    await deployMintpeg();

    registrantOwner = await ethers.getSigner(await osOwnedRegistrant.owner());
  };

  const deployMintpeg = async () => {
    mintpeg = await mintpegCF.deploy();
    await mintpeg.initialize(
      "JoePEG",
      "JOEPEG",
      dev.address,
      royaltyReceiver.address,
      100
    );

    await mintpeg.mint([
      "token0.joepegs.com",
      "token1.joepegs.com",
      "token2.joepegs.com",
      "token3.joepegs.com",
    ]);
  };

  // Selector for "AddressFiltered(address)" error
  const addressFilteredError = (address: string) =>
    `0xa8cf495d${abi.encode(["address"], [address]).slice(2)}`;

  before(async () => {
    mintpegCF = await ethers.getContractFactory("Mintpeg");
    filterRegistry = await ethers.getContractAt(
      "IOperatorFilterRegistry",
      "0x000000000000AAeB6D7670E522A718067333cd4E"
    );
    osOwnedRegistrant = await ethers.getContractAt(
      "OwnableUpgradeable",
      "0x3cc6CddA760b79bAfa08dF41ECFA224f810dCeB6"
    );

    signers = await ethers.getSigners();
    dev = signers[0];
    alice = signers[1];
    bob = signers[2];
    royaltyReceiver = signers[3];
  });

  beforeEach(async () => {
    await loadFixture(deployFixture);
  });

  describe("Using OpenSea list", async () => {
    const nftID = 1;

    it("Should be corretly setup", async () => {
      expect(await mintpeg.operatorFilterRegistry()).to.equal(
        filterRegistry.address
      );
      expect(await filterRegistry.callStatic.isRegistered(mintpeg.address)).to
        .be.true;
      expect(
        await filterRegistry.callStatic.subscriptionOf(mintpeg.address)
      ).to.be.equal(osOwnedRegistrant.address);
    });

    it("Should be transferable by operators", async () => {
      await mintpeg.setApprovalForAll(alice.address, true);
      await mintpeg
        .connect(alice)
        .transferFrom(dev.address, bob.address, nftID);
      expect(await mintpeg.ownerOf(nftID)).to.equal(bob.address);

      await mintpeg.connect(bob).approve(alice.address, nftID);
      await mintpeg
        .connect(alice)
        .transferFrom(bob.address, dev.address, nftID);
      expect(await mintpeg.ownerOf(nftID)).to.equal(dev.address);
    });

    it("Should block individual approvals if the operator is blocked", async () => {
      await filterRegistry
        .connect(registrantOwner)
        .updateOperator(osOwnedRegistrant.address, alice.address, true);
      // Hardhat doesn't seem to recognize custom revert reasons from external contracts
      // Doing a static call is a workaround
      await expect(
        mintpeg.callStatic.approve(alice.address, nftID)
      ).to.be.rejectedWith(addressFilteredError(alice.address));
    });

    it("Should block approvals for all if the operator is blocked", async () => {
      await filterRegistry
        .connect(registrantOwner)
        .updateOperator(osOwnedRegistrant.address, alice.address, true);
      await expect(
        mintpeg.callStatic.setApprovalForAll(alice.address, true)
      ).to.be.rejectedWith(addressFilteredError(alice.address));
    });

    it("Should block transfers if the operator is blocked", async () => {
      await mintpeg.setApprovalForAll(alice.address, true);
      await filterRegistry
        .connect(registrantOwner)
        .updateOperator(osOwnedRegistrant.address, alice.address, true);

      await expect(
        mintpeg
          .connect(alice)
          .callStatic.transferFrom(dev.address, bob.address, nftID)
      ).to.be.rejectedWith(addressFilteredError(alice.address));

      expect(await mintpeg.ownerOf(nftID)).to.equal(dev.address);
    });

    it("Should block safe transfers if the operator is blocked", async () => {
      await mintpeg.setApprovalForAll(alice.address, true);
      await filterRegistry
        .connect(registrantOwner)
        .updateOperator(osOwnedRegistrant.address, alice.address, true);

      await expect(
        mintpeg
          .connect(alice)
          .callStatic["safeTransferFrom(address,address,uint256)"](
            dev.address,
            bob.address,
            nftID
          )
      ).to.be.rejectedWith(addressFilteredError(alice.address));

      await expect(
        mintpeg
          .connect(alice)
          .callStatic["safeTransferFrom(address,address,uint256,bytes)"](
            dev.address,
            bob.address,
            nftID,
            []
          )
      ).to.be.rejectedWith(addressFilteredError(alice.address));

      expect(await mintpeg.ownerOf(nftID)).to.equal(dev.address);
    });

    it("Should allow transfers back if the operator is unblocked", async () => {
      await mintpeg.setApprovalForAll(alice.address, true);
      await filterRegistry
        .connect(registrantOwner)
        .updateOperator(osOwnedRegistrant.address, alice.address, true);

      await expect(
        mintpeg
          .connect(alice)
          .callStatic.transferFrom(dev.address, bob.address, nftID)
      ).to.be.rejectedWith(addressFilteredError(alice.address));

      expect(await mintpeg.ownerOf(nftID)).to.equal(dev.address);

      await filterRegistry
        .connect(registrantOwner)
        .updateOperator(osOwnedRegistrant.address, alice.address, false);
      await mintpeg
        .connect(alice)
        .transferFrom(dev.address, bob.address, nftID);

      expect(await mintpeg.ownerOf(nftID)).to.equal(bob.address);
    });

    it("Should disable the filter if the address is updated to address zero", async () => {
      await filterRegistry
        .connect(registrantOwner)
        .updateOperator(osOwnedRegistrant.address, alice.address, true);
      await expect(
        mintpeg.callStatic.approve(alice.address, nftID)
      ).to.be.rejectedWith(addressFilteredError(alice.address));

      await mintpeg.updateOperatorFilterRegistryAddress(
        ethers.constants.AddressZero
      );

      await mintpeg.approve(alice.address, nftID);
      expect(await mintpeg.getApproved(nftID)).to.equal(alice.address);

      await mintpeg
        .connect(alice)
        .transferFrom(dev.address, bob.address, nftID);
      expect(await mintpeg.ownerOf(nftID)).to.equal(bob.address);
    });

    it("Should disable the filter if mintpeg is unregistered", async () => {
      await filterRegistry
        .connect(registrantOwner)
        .updateOperator(osOwnedRegistrant.address, alice.address, true);
      await expect(
        mintpeg.callStatic.approve(alice.address, nftID)
      ).to.be.rejectedWith(addressFilteredError(alice.address));

      await filterRegistry.unregister(mintpeg.address);

      await mintpeg.approve(alice.address, nftID);
      expect(await mintpeg.getApproved(nftID)).to.equal(alice.address);

      await mintpeg
        .connect(alice)
        .transferFrom(dev.address, bob.address, nftID);
      expect(await mintpeg.ownerOf(nftID)).to.equal(bob.address);
    });

    it("Shouldn't be possible to update the filter registry address if the caller is not the owner", async () => {
      await expect(
        mintpeg
          .connect(alice)
          .updateOperatorFilterRegistryAddress(filterRegistry.address)
      ).to.be.rejectedWith("Ownable: caller is not the owner");
    });

    it("Shouldn't be possible to update the filter registry list if the caller is not the owner", async () => {
      await expect(
        filterRegistry
          .connect(alice)
          .callStatic.updateOperator(
            osOwnedRegistrant.address,
            alice.address,
            false
          )
      ).to.be.rejectedWith("0xfcf5eff8"); // OnlyAddressOrOwner()
    });
  });

  describe("Using custom list", async () => {
    const nftID = 1;

    beforeEach(async () => {
      // Opensea blocks Alice
      await filterRegistry
        .connect(registrantOwner)
        .updateOperator(osOwnedRegistrant.address, alice.address, true);
      // Joepegs forks from Opensea's list
      await filterRegistry.unregister(mintpeg.address);
      await filterRegistry.registerAndCopyEntries(
        mintpeg.address,
        osOwnedRegistrant.address
      );
    });

    it("Should block individual approvals if the operator is blocked for new and previous operators", async () => {
      await filterRegistry.updateOperator(mintpeg.address, bob.address, true);

      await expect(
        mintpeg.callStatic.approve(alice.address, nftID)
      ).to.be.rejectedWith(addressFilteredError(alice.address));

      await expect(
        mintpeg.callStatic.approve(bob.address, nftID)
      ).to.be.rejectedWith(addressFilteredError(bob.address));
    });

    it("Should block approvals for all if the operator is blocked for new and previous operators", async () => {
      await filterRegistry.updateOperator(mintpeg.address, bob.address, true);

      await expect(
        mintpeg.callStatic.setApprovalForAll(alice.address, true)
      ).to.be.rejectedWith(addressFilteredError(alice.address));

      await expect(
        mintpeg.callStatic.setApprovalForAll(bob.address, true)
      ).to.be.rejectedWith(addressFilteredError(bob.address));
    });

    it("Should block transfers if the operator is blocked for new  operators", async () => {
      await mintpeg.setApprovalForAll(bob.address, true);

      await filterRegistry.updateOperator(mintpeg.address, bob.address, true);

      await expect(
        mintpeg
          .connect(bob)
          .callStatic.transferFrom(dev.address, bob.address, nftID)
      ).to.be.rejectedWith(addressFilteredError(bob.address));

      expect(await mintpeg.ownerOf(nftID)).to.equal(dev.address);
    });

    it("Should block safe transfers if the operator is blocked for new operators", async () => {
      await mintpeg.setApprovalForAll(bob.address, true);

      await filterRegistry.updateOperator(mintpeg.address, bob.address, true);

      await expect(
        mintpeg
          .connect(bob)
          .callStatic["safeTransferFrom(address,address,uint256)"](
            dev.address,
            bob.address,
            nftID
          )
      ).to.be.rejectedWith(addressFilteredError(bob.address));

      await expect(
        mintpeg
          .connect(bob)
          .callStatic["safeTransferFrom(address,address,uint256,bytes)"](
            dev.address,
            bob.address,
            nftID,
            []
          )
      ).to.be.rejectedWith(addressFilteredError(bob.address));

      expect(await mintpeg.ownerOf(nftID)).to.equal(dev.address);
    });

    it("Should allow transfers back if the operator is unblocked for new and previous operators", async () => {
      await mintpeg.setApprovalForAll(bob.address, true);

      await filterRegistry.updateOperator(mintpeg.address, bob.address, true);

      await expect(
        mintpeg
          .connect(bob)
          .callStatic.transferFrom(dev.address, bob.address, nftID)
      ).to.be.rejectedWith(addressFilteredError(bob.address));

      expect(await mintpeg.ownerOf(nftID)).to.equal(dev.address);

      await filterRegistry.updateOperator(mintpeg.address, bob.address, false);
      await mintpeg.connect(bob).transferFrom(dev.address, bob.address, nftID);

      expect(await mintpeg.ownerOf(nftID)).to.equal(bob.address);
    });

    it("Should disable the filter if the address is updated to address zero for new and previous operators", async () => {
      await filterRegistry.updateOperator(mintpeg.address, bob.address, true);

      await expect(
        mintpeg.callStatic.approve(bob.address, nftID)
      ).to.be.rejectedWith(addressFilteredError(bob.address));

      await mintpeg.updateOperatorFilterRegistryAddress(
        ethers.constants.AddressZero
      );

      await mintpeg.approve(bob.address, nftID);
      expect(await mintpeg.getApproved(nftID)).to.equal(bob.address);

      await mintpeg.connect(bob).transferFrom(dev.address, bob.address, nftID);
      expect(await mintpeg.ownerOf(nftID)).to.equal(bob.address);

      await mintpeg.approve(alice.address, nftID + 1);
      expect(await mintpeg.getApproved(nftID + 1)).to.equal(alice.address);

      await mintpeg
        .connect(alice)
        .transferFrom(dev.address, bob.address, nftID + 1);
      expect(await mintpeg.ownerOf(nftID + 1)).to.equal(bob.address);
    });

    it("Should disable the filter if mintpeg is unregistered for new and previous operators", async () => {
      await filterRegistry.updateOperator(mintpeg.address, bob.address, true);

      await expect(
        mintpeg.callStatic.approve(bob.address, nftID)
      ).to.be.rejectedWith(addressFilteredError(bob.address));

      await filterRegistry.unregister(mintpeg.address);

      await mintpeg.approve(alice.address, nftID);
      expect(await mintpeg.getApproved(nftID)).to.equal(alice.address);

      await mintpeg
        .connect(alice)
        .transferFrom(dev.address, bob.address, nftID);
      expect(await mintpeg.ownerOf(nftID)).to.equal(bob.address);

      await mintpeg.approve(bob.address, nftID + 1);
      expect(await mintpeg.getApproved(nftID + 1)).to.equal(bob.address);

      await mintpeg
        .connect(bob)
        .transferFrom(dev.address, bob.address, nftID + 1);
      expect(await mintpeg.ownerOf(nftID + 1)).to.equal(bob.address);
    });
  });
});
