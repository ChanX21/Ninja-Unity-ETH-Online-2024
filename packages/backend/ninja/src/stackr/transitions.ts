import { Hook, Hooks, REQUIRE, STF, Transitions } from "@stackr/sdk/machine";
import { hashMessage, ZeroAddress } from "ethers";
import { NinjaStrikeState } from "./state";

type StartGameInput = { player1: string, player2: string };
type JoinGameInput = { gameId: string };
type MoveInput = { gameId: string, move: string, hit: number };
type EndGameInput = { gameId: string };

const PRUNE_GAMES_INTERVAL = 300_000; // 5 minutes

// Create a new game
const createGame: STF<NinjaStrikeState, StartGameInput> = {
  handler: ({ state, inputs, msgSender, block, emit }) => {
    const gameId = hashMessage(
      `${msgSender}::${block.timestamp}::${state.games.length}`
    );

    const { player1 } = inputs;
    
    state.games.push({
      gameId,
      player1: String(player1),
      player2: "",
      createdAt: block.timestamp,
      startedAt: 0,
      endedAt: 0,
      status: "in_lobby",
      lastMove: "",
      lastPlayer: "",
      hitCountP1: 0,
      hitCountP2: 0,
      winner: "",
    });

    emit({
      name: "GameCreated",
      value: gameId,
    });

    return state;
  },
};

// Join an existing game
const joinGame: STF<NinjaStrikeState, JoinGameInput> = {
  handler: ({ state, inputs, msgSender, block }) => {
    const { gameId } = inputs;
    const game = state.games.find(g => g.gameId === gameId);
    
    if (!game) {
      throw new Error("GAME_NOT_FOUND");
    }

    REQUIRE(game.startedAt === 0, "GAME_AlREADY_STARTED");
    REQUIRE(
      game.player1 !== String(msgSender),
      "ALREADY_IN_GAME"
    );

    // Start the game once both players have joined
    game.player2 = msgSender;
    game.startedAt = block.timestamp;
    game.status = "in_play"

    return state;
  },
};

// Handle a move in the game
const trackMove: STF<NinjaStrikeState, MoveInput> = {
  handler: ({ state, inputs, msgSender, block, emit }) => {
    const { gameId, move, hit } = inputs;
    const game = state.games.find(g => g.gameId === gameId);
    
    if (!game) {
      throw new Error("GAME_NOT_FOUND");
    }

    REQUIRE(game.startedAt !== 0, "GAME_NOT_STARTED");
    REQUIRE(game.endedAt === 0, "GAME_ENDED");
    REQUIRE(
      game.player1 === String(msgSender) || game.player2 === String(msgSender),
      "PLAYER_NOT_IN_GAME"
    );
    REQUIRE(game.lastPlayer !== String(msgSender), "NOT_YOUR_TURN");

    // Update the game's last move and player
    game.lastMove = move;
    game.lastPlayer = String(msgSender);

    if(hit != 0){
      if(game.player1 === String(msgSender)){
        game.hitCountP2 += 1;
        if(game.hitCountP2 >= 1){
          game.winner = String(msgSender);
          game.endedAt = block.timestamp;
          game.status = "ended";

          emit({
            name: "gameWon",
            value: String(msgSender),
          });
        }
      }
      else {
        game.hitCountP1 += 1;
        if(game.hitCountP1 >= 1){
          game.winner = String(msgSender);
          game.endedAt = block.timestamp;
          game.status = "ended";
          emit({
            name: "gameWon",
            value: String(msgSender),
          });
        }
      }
    }

    let currentPlayer =  ( String(msgSender) === game.player1 ) ? "player 1" : "player 2";   

    emit({
      name: "moveTracked",
      value: move,
    });
    emit({
      name: "moveOrigin",
      value: [msgSender,currentPlayer],
    });

    return state;
  },
};

// End the game
const endGame: STF<NinjaStrikeState, EndGameInput> = {
  handler: ({ state, inputs, msgSender, block, emit }) => {
    const { gameId } = inputs;
    const game = state.games.find(g => g.gameId === gameId);

    if (!game) {
      throw new Error("GAME_NOT_FOUND");
    }

    REQUIRE(game.endedAt === 0, "GAME_ALREADY_ENDED");
    REQUIRE("0xfcAe752B10e1952Ca2AcdB8AacafbfA4188b85ec" === String(msgSender), "CALLER_NOT_OWNER");

    // End the game
    game.endedAt = block.timestamp;
    game.status = "ended";

    emit({
      name: "GameEnded",
      value: gameId,
    });

    return state;
  },
};

// Hook to prune inactive games
const pruneGames: Hook<NinjaStrikeState> = {
  handler: ({ state, block }) => {
    const { games } = state;
    state.games = games.filter(game => {
      return !(game.startedAt === 0 && block.timestamp - game.createdAt > PRUNE_GAMES_INTERVAL);
    });
    return state;
  },
};

export const transitions: Transitions<NinjaStrikeState> = {
  createGame,
  joinGame,
  trackMove,
  endGame,
};

export const hooks: Hooks<NinjaStrikeState> = {
  pruneGames,
};
