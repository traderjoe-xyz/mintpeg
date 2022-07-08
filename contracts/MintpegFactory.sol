// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./Mintpeg.sol";

contract MintpegFactory {
    /// @notice Emitted on createMintpeg()
    /// @param mintpeg Address of deployed mintpeg
    /// @param name Mintpeg (ERC721) name
    /// @param symbol Mintpeg (ERC721) symbol
    /// @param projectOwner The project owner
    /// @param royaltyReceiver Royalty fee collector
    event MintpegCreated(
        address indexed mintpeg,
        string name,
        string symbol,
        address indexed projectOwner,
        address indexed royaltyReceiver
    );

    /// @dev number of mintpegs deployed
    uint256 public numOfMintpegs;

    /// @dev Mapping of all deployed mintpegs indexes to their addresses
    /// @notice Index is zero based
    mapping(uint256 => address) public allMintpegs;

    /// @notice Function for creating mintpegs
    /// @param _name ERC721 name
    /// @param _symbol ERC721 symbol
    /// @param _projectOwner The project owner
    /// @param _royaltyReceiver Royalty fee collector
    /// @param _feePercent Royalty fee numerator; denominator is 10,000. So 500 represents 5%
    function createMintpeg(
        string memory _name,
        string memory _symbol,
        address _projectOwner,
        address _royaltyReceiver,
        uint96 _feePercent
    ) public {
        Mintpeg mintpeg = new Mintpeg(
            _name,
            _symbol,
            _projectOwner,
            _royaltyReceiver,
            _feePercent
        );
        allMintpegs[numOfMintpegs] = address(mintpeg);
        numOfMintpegs++;

        emit MintpegCreated(
            address(mintpeg),
            _name,
            _symbol,
            _projectOwner,
            _royaltyReceiver
        );
    }
}
