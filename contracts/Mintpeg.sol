// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./MintpegErrors.sol";

contract Mintpeg is ERC721URIStorage, ERC2981, Ownable {
    /// @dev Keeps track of Token IDs
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    /// @notice Emmited on setRoyaltyInfo()
    /// @param royaltyReceiver Royalty fee collector
    /// @param feePercent Royalty fee numerator; denominator is 10,000. So 500 represents 5%
    event RoyaltyInfoChanged(
        address indexed royaltyReceiver,
        uint96 feePercent
    );

    /// @notice Mintpeg initialization
    /// @dev Can only be called once
    /// @param _collectionName ERC721 name
    /// @param _collectionSymbol ERC721 symbol
    /// @param _projectOwner The project owner
    /// @param _royaltyReceiver Royalty fee collector
    /// @param _feePercent Royalty fee numerator; denominator is 10,000. So 500 represents 5%
    constructor(
        string memory _collectionName,
        string memory _collectionSymbol,
        address _projectOwner,
        address _royaltyReceiver,
        uint96 _feePercent
    ) ERC721(_collectionName, _collectionSymbol) {
        // Royalty fees are limited to 25%
        if (_feePercent > 2_500) {
            revert Mintpeg__InvalidRoyaltyInfo();
        }
        _setDefaultRoyalty(_royaltyReceiver, _feePercent);

        // transfer ownership of contract to project owner
        if (_projectOwner == address(0)) {
            revert Mintpeg__InvalidProjectOwner();
        }
        transferOwnership(_projectOwner);
    }

    /// @dev Function to mint new tokens
    /// @notice Can only be called by project owner
    /// @param _tokenURIs Array of tokenURIs (probably IPFS) of the tokenIds to be minted
    function mint(string[] memory _tokenURIs) external onlyOwner {
        uint256 newTokenId;
        for (uint256 i = 0; i < _tokenURIs.length; i++) {
            newTokenId = _tokenIds.current();
            _mint(msg.sender, newTokenId);
            _setTokenURI(newTokenId, _tokenURIs[i]);
            _tokenIds.increment();
        }
    }

    /// @dev Function for changing royalty information
    /// @notice Can only be called by project owner
    /// @param _royaltyReceiver Royalty fee collector
    /// @param _feePercent Royalty fee numerator; denominator is 10,000. So 500 represents 5%
    function setRoyaltyInfo(address _royaltyReceiver, uint96 _feePercent)
        external
        onlyOwner
    {
        // Royalty fees are limited to 25%
        if (_feePercent > 2_500) {
            revert Mintpeg__InvalidRoyaltyInfo();
        }
        _setDefaultRoyalty(_royaltyReceiver, _feePercent);
        emit RoyaltyInfoChanged(_royaltyReceiver, _feePercent);
    }

    /// @dev Function to burn a token
    /// @notice Can only be called by token owner
    /// @param _tokenId Token ID to be burnt
    function burn(uint256 _tokenId) external {
        if (ownerOf(_tokenId) != msg.sender) {
            revert Mintpeg_InvalidTokenOwner();
        }
        super._burn(_tokenId);
    }

    /// @dev Returns true if this contract implements the interface defined by `interfaceId`
    /// @notice Needs to be overridden cause two base contracts implement it
    /// @param _interfaceId InterfaceId to consider. Comes from type(InterfaceContract).interfaceId
    /// @return isInterfaceSupported True if the considered interface is supported
    function supportsInterface(bytes4 _interfaceId)
        public
        view
        virtual
        override(ERC721, ERC2981)
        returns (bool)
    {
        return
            ERC721.supportsInterface(_interfaceId) ||
            ERC2981.supportsInterface(_interfaceId) ||
            super.supportsInterface(_interfaceId);
    }
}
