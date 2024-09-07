// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract EscrowGameMapping {
    address public owner;

    // Mapping from EscrowId (uint256) to GameId (bytes32)
    mapping(uint256 => bytes32) public escrowToGame;

    // Event to log the mapping creation
    event MappingCreated(uint256 indexed escrowId, bytes32 indexed gameId);

    // Modifier to restrict function access to the owner
    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not the owner");
        _;
    }

    // Constructor to set the contract deployer as the initial owner
    constructor() {
        owner = msg.sender;
    }

    // Function to transfer ownership to a new address (only callable by the current owner)
    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "New owner is the zero address");
        owner = newOwner;
    }

    // Function to create a new mapping between EscrowId and GameId
    function createMapping(uint256 escrowId, bytes32 gameId) public onlyOwner {
        // Ensure that the EscrowId is not already mapped
        require(escrowToGame[escrowId] == bytes32(0), "EscrowId is already mapped to a GameId.");

        // Create the mapping
        escrowToGame[escrowId] = gameId;

        // Emit the event
        emit MappingCreated(escrowId, gameId);
    }

    // Function to retrieve the GameId for a given EscrowId
    function getGameId(uint256 escrowId) public view returns (bytes32) {
        return escrowToGame[escrowId];
    }
}
