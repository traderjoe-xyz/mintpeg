/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer, utils } from "ethers";
import type { Provider } from "@ethersproject/providers";
import type {
  IMintpeg,
  IMintpegInterface,
} from "../../../contracts/interfaces/IMintpeg";

const _abi = [
  {
    inputs: [
      {
        internalType: "string",
        name: "_collectionName",
        type: "string",
      },
      {
        internalType: "string",
        name: "_collectionSymbol",
        type: "string",
      },
      {
        internalType: "address",
        name: "_royaltyReceiver",
        type: "address",
      },
      {
        internalType: "uint96",
        name: "_feePercent",
        type: "uint96",
      },
    ],
    name: "initialize",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

export class IMintpeg__factory {
  static readonly abi = _abi;
  static createInterface(): IMintpegInterface {
    return new utils.Interface(_abi) as IMintpegInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): IMintpeg {
    return new Contract(address, _abi, signerOrProvider) as IMintpeg;
  }
}