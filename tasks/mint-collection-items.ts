import "@nomiclabs/hardhat-ethers";
import "hardhat-deploy";
import "hardhat-deploy-ethers";
import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import "dotenv/config";
import { task } from "hardhat/config";
import { loadMintConfig } from "./utils";

interface AddCollectionItemsProps {
  metaFilename: string;
  itemFilename: string;
  mintpegAddress: string;
}

task("mint-collection-items", "Mint new NFTs to a Mintpeg contract instance")
  .addParam("metaFilename", "JSON file for an array of metadata")
  .addParam("itemFilename", "JSON file for an array of item(images) names")
  .addParam(
    "mintpegAddress",
    "contract address of deployed Mintpeg to mint items from"
  )
  .setAction(
    async (
      { metaFilename, itemFilename, mintpegAddress }: AddCollectionItemsProps,
      hre
    ) => {
      const JOEBARN_API_URL = process.env.JOEBARN_API_URL;
      if (!JOEBARN_API_URL) {
        throw new Error("JOEBARN_API_URL env variable not set!");
      }

      console.log("-- Reading Images and Metadatas --");

      // create form-data
      const form = new FormData();
      const metaDatas: Array<Object> = loadMintConfig(metaFilename);
      const imageNames: string[] = loadMintConfig(itemFilename);
      if (metaDatas.length !== imageNames.length) {
        throw new Error(
          `Mismatch config count: ${metaDatas.length} metadata gotten for ${imageNames.length} images`
        );
      }

      imageNames.forEach((image) => {
        const pathToImage = __dirname + "/config/mint/images/" + image;
        if (!fs.existsSync(pathToImage)) {
          throw new Error(`/mint/images/${image} not found.`);
        }
        form.append("images", fs.createReadStream(pathToImage));
      });
      form.append("metadatas", JSON.stringify(metaDatas));

      try {
        console.log("-- Uploading Images to IPFS --");

        const ipfsCidUrls = await axios.post(
          `${JOEBARN_API_URL}/v2/mints/upload`,
          form,
          {
            headers: form.getHeaders(),
          }
        );

        console.log(`-- Minting Token(s) from IPFS CID(s) --`);

        const ethers = hre.ethers;
        const mintpegContract = await ethers.getContractAt(
          "Mintpeg",
          mintpegAddress
        );
        const mintTx = await mintpegContract.mint(ipfsCidUrls.data);
        await mintTx.wait();
        console.log(
          `-- Minted ${ipfsCidUrls.data.length} token(s) from ${mintpegAddress}  --`
        );
      } catch (error) {
        console.log(error);
      }
    }
  );
