// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

/**
 * @title NFT
 * @dev A basic implementation of an ERC721 Non-Fungible Token using OpenZeppelin libraries.
 * This contract allows the minting of new tokens and includes metadata for each token.
 */
contract NFT is ERC721URIStorage {
	// Counter for the next token ID to be minted
	uint256 private _tokenIdCounter;

	// Mapping from owner address to list of owned token IDs
	mapping(address => uint256[]) private _ownedTokens;

	/**
	 * @dev Initializes the contract by setting a `name` and a `symbol` to the token collection.
	 * @param name The name of the NFT collection.
	 * @param symbol The symbol of the NFT collection.
	 */
	constructor(
		string memory name,
		string memory symbol
	) ERC721(name, symbol) {}

	/**
	 * @notice Mints a new token with a given URI to a specified address.
	 * @dev Only the owner of the contract can mint new tokens.
	 * @param to The address to which the newly minted token will be assigned.
	 * @param tokenURI The URI of the token metadata.
	 */
	function mint(address to, string memory tokenURI) external {
		uint256 tokenId = _tokenIdCounter;
		_tokenIdCounter += 1;

		_mint(to, tokenId);
		_setTokenURI(tokenId, tokenURI);

		// Add the token to the owner's list of owned tokens
		_ownedTokens[to].push(tokenId);
	}

	/**
	 * @notice Returns a list of token IDs owned by a given address.
	 * @param owner The address to query.
	 * @return A list of token IDs owned by `owner`.
	 */
	function tokensOfOwner(
		address owner
	) external view returns (uint256[] memory) {
		return _ownedTokens[owner];
	}
}
