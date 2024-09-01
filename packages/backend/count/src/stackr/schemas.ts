import { ActionSchema, SolidityType } from "@stackr/sdk";

// Schema for creating a new game
export const CreateGameSchema = new ActionSchema("createGame", {
  player1: SolidityType.STRING,   // Player 1's address
  timestamp: SolidityType.UINT,   // Timestamp for when the game is created
});

// Schema for joining an existing game
export const JoinGameSchema = new ActionSchema("joinGame", {
  gameId: SolidityType.STRING,    // Unique ID of the game to join
  timestamp: SolidityType.UINT,   // Timestamp for when the player is joining the game
});

// Schema for tracking a move within a game
export const TrackMoveSchema = new ActionSchema("trackMove", {
  gameId: SolidityType.STRING,    // Unique ID of the game
  move: SolidityType.STRING,      // Details of the move made
  timestamp: SolidityType.UINT,   // Timestamp for when the move is made
});

// Schema for ending a game
export const EndGameSchema = new ActionSchema("endGame", {
  gameId: SolidityType.STRING,    // Unique ID of the game to end
  timestamp: SolidityType.UINT,   // Timestamp for when the game is ended
});

// Hook schema can be added as well if required
