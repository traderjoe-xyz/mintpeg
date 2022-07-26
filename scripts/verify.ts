import { HardhatRuntimeEnvironment } from "hardhat/types";

export default async (
  hre: HardhatRuntimeEnvironment,
  contractName: string,
  address: string | undefined,
  constructorArguments: any[]
) => {
  if (!address) {
    throw new Error(`undefined contract address for ${contractName}`);
  }
  try {
    await hre.run("verify:verify", {
      address,
      constructorArguments,
      contract: contractName,
    });
  } catch (err) {
    if (
      (err as any).message.includes("Reason: Already Verified") ||
      (err as any).message.includes("already verified")
    ) {
      console.log("Contract is already verified!");
    } else {
      throw err;
    }
  }
};
