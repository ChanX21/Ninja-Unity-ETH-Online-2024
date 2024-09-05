// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import "./LZ.sol";

contract NFT is ERC721, ERC721URIStorage, Ownable {
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    uint256 counter;
    LZ lz;
    address lzAddress;
    uint32 dstEid;
    struct NFTData {
        string status;
        bool locked;
    }
    string data;
    mapping(uint256 => NFTData) public nftData;
    mapping(uint256 => bool) public pausedTokens;
    mapping(address => uint256[]) public tokensByAddress;

    bool public onlyOwnerCanMint = false;

    event TokenMinted(uint256 tokenId, address to);
    event MetadataLocked(uint256 tokenId);
    event MetadataUnlocked(uint256 tokenId);
    event TokenPaused(uint256 tokenId);
    event TokenUnpaused(uint256 tokenId);

    constructor()
        ERC721("Ninja Avatar Minter Extrodinaire", "NAME")
        Ownable(msg.sender)
    {}

    function setOnlyOwnerCanMint(bool _onlyOwnerCanMint) external onlyOwner {
        onlyOwnerCanMint = _onlyOwnerCanMint;
    }

    function setLZ(address _lz, uint32 _dstEid) public onlyOwner {
        lz = LZ(_lz);
        lzAddress = _lz;
        dstEid = _dstEid;
    }

    function mint(
        address to,
        string memory URI
    ) public payable {
        require(
            !onlyOwnerCanMint ||
                (msg.sender == lzAddress || msg.sender == owner()),
            "Minting is restricted to the owner"
        );

        uint256 tokenId = counter;
        counter++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, URI);

        tokensByAddress[to].push(tokenId); // Add token to the new owner's list

        nftData[tokenId] = NFTData({status: "active", locked: false});
        bytes memory _payload = abi.encode(to, 0, "", URI);

        if (msg.sender != lzAddress) {
         (uint128 gasLimit, uint128 gas) = lz.fees();
		 uint256 fee = lz.quote(dstEid, _payload, lz.createLzReceiveOption(gasLimit,gas),false);
		 require(msg.value>=fee,"lz: not enough gas");
		 lz.send{value: fee}(dstEid, _payload);
		}
        emit TokenMinted(tokenId, to);
    }
function fees(uint32 _dstEid, address to, string memory URI) view public returns(uint256){
        bytes memory _payload = abi.encode(to, 0, "", URI);
        (uint128 gasLimit, uint128 gas) = lz.fees();
		return lz.quote(_dstEid, _payload, lz.createLzReceiveOption(gasLimit, gas),false);
		
}
    function updateNFT(
        uint256 tokenId,
        string memory status,
        string memory URI
    ) public payable {
        require(counter >= tokenId && tokenId > 0, "NFT does not exist");
        require(
            !onlyOwnerCanMint ||
                (msg.sender == lzAddress || msg.sender == owner()),
            "Caller is not the owner or NFT owner"
        );
        require(!nftData[tokenId].locked, "Metadata is locked");

        if (bytes(status).length > 0) nftData[tokenId].status = status;
        if (bytes(URI).length > 0) _setTokenURI(tokenId, URI);
        bytes memory _payload = abi.encode(address(0), tokenId, status, URI);

        if (msg.sender != lzAddress) {
        (uint128 gasLimit, uint128 gas) = lz.fees();
		 uint256 fee = lz.quote(dstEid, _payload, lz.createLzReceiveOption(gasLimit,gas),false);
		 require(msg.value>=fee,"lz: not enough gas");
		 lz.send{value: fee}(dstEid, _payload);
		}
    }

    function lock(uint256 tokenId) public {
        require(counter >= tokenId && tokenId > 0, "NFT does not exist");
        require(
            msg.sender == owner() || msg.sender == ownerOf(tokenId),
            "Caller is not the owner or NFT owner"
        );

        nftData[tokenId].locked = true;
        emit MetadataLocked(tokenId);
    }

    function unlock(uint256 tokenId) public onlyOwner {
        require(counter >= tokenId && tokenId > 0, "NFT does not exist");
        nftData[tokenId].locked = false;
        emit MetadataUnlocked(tokenId);
    }

    function pauseToken(uint256 tokenId) public onlyOwner {
        require(counter >= tokenId && tokenId > 0, "NFT does not exist");
        pausedTokens[tokenId] = true;
        emit TokenPaused(tokenId);
    }

    function unpauseToken(uint256 tokenId) public onlyOwner {
        require(counter >= tokenId && tokenId > 0, "NFT does not exist");
        pausedTokens[tokenId] = false;
        emit TokenUnpaused(tokenId);
    }

    function _update(
        address from,
        address to,
        uint256 tokenId,
        address auth
    ) internal {
        if (from != address(0)) {
            // Remove token from the previous owner's list
            uint256 index;
            uint256[] storage tokens = tokensByAddress[from];
            for (uint256 i = 0; i < tokens.length; i++) {
                if (tokens[i] == tokenId) {
                    index = i;
                    break;
                }
            }
            tokens[index] = tokens[tokens.length - 1];
            tokens.pop();
        }

        if (to != address(0)) {
            // Add token to the new owner's list
            tokensByAddress[to].push(tokenId);
        }

        super._update(to, tokenId, auth);
    }
}
