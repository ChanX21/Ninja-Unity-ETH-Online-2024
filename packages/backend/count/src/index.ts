import { ActionConfirmationStatus } from "@stackr/sdk";
import { Wallet } from "ethers";
import { mru } from "./stackr/mru.ts";
import { JoinGameSchema, TrackMoveSchema, CreateGameSchema, EndGameSchema } from "./stackr/schemas.ts";
import { signMessage } from "./utils.ts";
import { Playground } from "@stackr/sdk/plugins";
import express from "express";

const PORT = process.env.PORT || 3210;

const main = async () => {
  const app = express();
  app.use(express.json({ limit: "50mb" }));

  // Allow CORS
  app.use((_req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
    next();
  });

  console.log("Started server...");

  // Create a random wallet
  const wallet = Wallet.createRandom();
  console.log("Wallet Address:", wallet.address);
  const wallet2 = Wallet.createRandom();

  // Playground initialization
  Playground.init(mru);

  // Example 1: Create a Game
  const createGameInputs = {
    player1: wallet.address,
    player2: wallet2.address, // Replace with actual player2 address
    timestamp: Date.now(),
  };
  console.log("Create Game Inputs:", createGameInputs);

  const createGameSignature = await signMessage(wallet, CreateGameSchema, createGameInputs);
  console.log("Create Game Signature:", createGameSignature);

  const createGameAction = CreateGameSchema.actionFrom({
    inputs: createGameInputs,
    signature: createGameSignature,
    msgSender: wallet.address,
  });

  const createGameAck = await mru.submitAction("createGame", createGameAction);
  console.log("Create Game Acknowledgment:", createGameAck);

  // Wait for confirmation (C1) and log any errors
  const { logs: createGameLogs, errors: createGameErrors } = await createGameAck.waitFor(ActionConfirmationStatus.C1);
  console.log({ createGameLogs, createGameErrors });

  const gameId = (createGameLogs && createGameLogs.length > 0) ? createGameLogs[0].value.toString() : "undefined";


  // Example 2: Join a Game
  // const joinGameInputs = {
  //   gameId: gameId, // Replace with actual gameId from the created game
  //   timestamp: Date.now(),
  // };
  // console.log("Join Game Inputs:", joinGameInputs);

  // const joinGameSignature = await signMessage(wallet2, JoinGameSchema, joinGameInputs);
  // console.log("Join Game Signature:", joinGameSignature);

  // const joinGameAction = JoinGameSchema.actionFrom({
  //   inputs: joinGameInputs,
  //   signature: joinGameSignature,
  //   msgSender: wallet2.address,
  // });

  // const joinGameAck = await mru.submitAction("joinGame", joinGameAction);
  // console.log("Join Game Acknowledgment:", joinGameAck);

  // const { logs: joinGameLogs, errors: joinGameErrors } = await joinGameAck.waitFor(ActionConfirmationStatus.C1);
  // console.log({ joinGameLogs, joinGameErrors });

  // Example 3: Track a Move
  // const trackMoveInputs = {
  //   gameId: gameId, // Replace with actual gameId
  //   move: "9,9", // Replace with actual move
  //   timestamp: Date.now(),
  // };
  // console.log("Track Move Inputs:", trackMoveInputs);

  // const trackMoveSignature = await signMessage(wallet, TrackMoveSchema, trackMoveInputs);
  // console.log("Track Move Signature:", trackMoveSignature);

  // const trackMoveAction = TrackMoveSchema.actionFrom({
  //   inputs: trackMoveInputs,
  //   signature: trackMoveSignature,
  //   msgSender: wallet.address,
  // });

  // const trackMoveAck = await mru.submitAction("trackMove", trackMoveAction);
  // console.log("Track Move Acknowledgment:", trackMoveAck);

  // const { logs: trackMoveLogs, errors: trackMoveErrors } = await trackMoveAck.waitFor(ActionConfirmationStatus.C1);
  // console.log({ trackMoveLogs, trackMoveErrors });

  // Example 4: End the Game
  // const endGameInputs = {
  //   gameId: gameId, // Replace with actual gameId
  //   timestamp: Date.now(),
  // };
  // console.log("End Game Inputs:", endGameInputs);

  // const endGameSignature = await signMessage(wallet, EndGameSchema, endGameInputs);
  // console.log("End Game Signature:", endGameSignature);

  // const endGameAction = EndGameSchema.actionFrom({
  //   inputs: endGameInputs,
  //   signature: endGameSignature,
  //   msgSender: wallet.address,
  // });

  // const endGameAck = await mru.submitAction("endGame", endGameAction);
  // console.log("End Game Acknowledgment:", endGameAck);

  // const { logs: endGameLogs, errors: endGameErrors } = await endGameAck.waitFor(ActionConfirmationStatus.C1);
  // console.log({ endGameLogs, endGameErrors });

  // Start the express server
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

main();
