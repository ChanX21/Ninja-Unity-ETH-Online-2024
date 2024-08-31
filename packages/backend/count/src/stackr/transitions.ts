import { Hook, Hooks, REQUIRE, STF, Transitions } from "@stackr/sdk/machine";
import { hashMessage, ZeroAddress } from "ethers";
import { CounterState } from "./state";

type StartGameInput = { player1: string, player2: string };
type JoinGameInput = { gameId: string };
type MoveInput = { gameId: string, move: string };

const PRUNE_GAMES_INTERVAL = 300_000; // 5 minutes

// Create a new game
const createGame: STF<CounterState, StartGameInput> = {
  handler: ({ state, inputs, msgSender, block, emit }) => {
    const gameId = hashMessage(
      `${msgSender}::${block.timestamp}::${state.games.length}`
    );

    const { player1, player2 } = inputs;
    
    state.games.push({
      gameId,
      player1: String(player1),
      player2: String(player2),
      createdAt: block.timestamp,
      startedAt: 0,
      endedAt: 0,
      status: "in_play",
      lastMove: "",
      lastPlayer: ""
    });

    emit({
      name: "GameCreated",
      value: gameId,
    });

    return state;
  },
};

// Join an existing game
const joinGame: STF<CounterState, JoinGameInput> = {
  handler: ({ state, inputs, msgSender, block }) => {
    const { gameId } = inputs;
    const game = state.games.find(g => g.gameId === gameId);
    
    if (!game) {
      throw new Error("GAME_NOT_FOUND");
    }

    // REQUIRE(game.startedAt === 0, "GAME_STARTED");
    // REQUIRE(
    //   game.player1 !== String(msgSender) && game.player2 !== String(msgSender),
    //   "ALREADY_IN_GAME"
    // );

    // Start the game once both players have joined
    game.startedAt = block.timestamp;

    return state;
  },
};

// Handle a move in the game
const trackMove: STF<CounterState, MoveInput> = {
  handler: ({ state, inputs, msgSender, block, emit }) => {
    const { gameId, move } = inputs;
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

    // Logic for ending the game (this could be based on specific conditions in your game)
    // if (/* check for game ending condition */ false) {
    //   game.endedAt = block.timestamp;
    //   game.status = "ended"; // or assign winner

    //   emit({
    //     name: "GameEnded",
    //     value: gameId,
    //   });
    // }

    emit({
      name: "MoveTracked",
      value: move,
    });

    return state;
  },
};

// Hook to prune inactive games
const pruneGames: Hook<CounterState> = {
  handler: ({ state, block }) => {
    const { games } = state;
    state.games = games.filter(game => {
      return !(game.startedAt === 0 && block.timestamp - game.createdAt > PRUNE_GAMES_INTERVAL);
    });
    return state;
  },
};

export const transitions: Transitions<CounterState> = {
  createGame,
  joinGame,
  trackMove,
};

export const hooks: Hooks<CounterState> = {
  pruneGames,
};
