# Mintpeg

This repository contains two contracts:

- **Mintpeg** implements upgradable contracts of [ERC721URIStorage](https://github.com/OpenZeppelin/openzeppelin-contracts-upgradeable/blob/master/contracts/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol) and [ERC2981](https://github.com/OpenZeppelin/openzeppelin-contracts-upgradeable/blob/master/contracts/token/common/ERC2981Upgradeable.sol) that allows for storing token metadata and setting royalties.
- **MintpegFactory** allows for creating and keeping track of **Mintpeg** contracts. It uses the contract cloning technique implemented in [OpenZeppelin Proxy Clone](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/proxy/Clones.sol) which optimizes the gas used in creating new **Mintpeg** contracts.

## How does it work?

### Contracts

#### Mintpeg

Main contract that implements `ERC721URIStorage` and `ERC2981` contracts. It allows only contract owner to `mint` new tokens and set royalty information.

#### MintpegFactory

Contract factory that deploy and keep track of `Mintpeg` contracts using the parameters specified below. It keeps track of the addresses of all created mintpegs and the mintpegs created by individual addresses.

##### initialize / configure

`_collectionName`: name of the NFT collection
`_collectionSymbol`: symbol of the NFT collection
`_royaltyReceiver`: address that receives royalty on NFT sale
`_feePercent`: royalty fee numerator; denominator is 10,000. So 500 represents 5%

## Setup

We use Hardhat to develop, compile, test and deploy contracts.

```
# install dependencies
yarn install
```

## Testing

```
yarn test # run test
npx hardhat coverage # run coverage report from solidity-coverage
```

## Deploy Contracts

There are two environment variables to define in the `.env` file:

```
# The contract deployer - `0x` prefixed
DEPLOY_PRIVATE_KEY=
# The snowtrace API key used to verify contracts
SNOWTRACE_API_KEY=
```

Deploying MintpegFactory and Mintpeg implementation contracts is done using `yarn deploy-<<network>>` where network is either `fuji` or `mainnet`(avalanche). Creating Mintpeg contracts then uses the `deploy-mintpeg` hardhat task:
The task takes a config file as parameter. This file contains all the required parameters to initialize a Mintpeg contract.

An example template is available in `/tasks/config/example-mintpeg.json`.

Once the configuration is ready, you may run:

```
yarn compile

# network is either fuji or mainnet(avalanche)
yarn deploy-mintpeg-<<network>> --config-filename <config-filename>
```


## Test coverage

Test coverage on current commit `fd24448` is the following :
File                   |  % Stmts | % Branch |  % Funcs |  % Lines |
-----------------------|----------|----------|----------|----------|
  Mintpeg.sol          |    95.24 |      100 |    83.33 |    95.83 |
  MinpegErrors.sol     |      100 |      100 |      100 |      100 |
  MintpegFactory.sol   |      100 |      100 |      100 |      100 |
  **All files**        |    97.06 |      100 |    91.67 |    97.44 |

Coverage was calculated by the `solidity-coverage` plugin from hardhat.

## License

[MIT](LICENSE.txt)
