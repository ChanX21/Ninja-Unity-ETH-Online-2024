import { ActionConfirmationStatus, ActionSchema } from "@stackr/sdk";
import { Wallet } from "ethers";
import { mru } from "./stackr/mru.ts";
import { JoinGameSchema, TrackMoveSchema, CreateGameSchema, EndGameSchema } from "./stackr/schemas.ts";
import { signMessage } from "./utils.ts";
import { Playground } from "@stackr/sdk/plugins";
import express, { Request, Response } from "express";

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

  app.post("/:trackMove", async (req: Request, res: Response) => {

    let { move, playerNo, gameId } = req.body;

    const trackMoveInputs = {
      gameId: gameId, // Replace with actual gameId
      move: move, // Replace with actual move
      timestamp: Date.now(),
    };
    console.log("Track Move Inputs:", trackMoveInputs);



    let walletNow = playerNo == 1 ? wallet : wallet2

    const trackMoveSignature = await signMessage(walletNow, TrackMoveSchema, trackMoveInputs);
    console.log("Track Move Signature:", trackMoveSignature);

    const trackMoveAction = TrackMoveSchema.actionFrom({
      inputs: trackMoveInputs,
      signature: trackMoveSignature,
      msgSender: walletNow.address,
    });

    const trackMoveAck = await mru.submitAction("trackMove", trackMoveAction);
    console.log("Track Move Acknowledgment:", trackMoveAck);

    const { logs: trackMoveLogs, errors: trackMoveErrors } = await trackMoveAck.waitFor(ActionConfirmationStatus.C1);
    console.log({ trackMoveLogs, trackMoveErrors });
    res.status(200).json({ success: true });
    return;
  });

  const stfSchemaMap: Record<string, ActionSchema> = {
    startGame: CreateGameSchema,
    endGame: EndGameSchema,
    joinGame: JoinGameSchema,
    trackMove: TrackMoveSchema
  };

  const handleAction = async (
    transition: string,
    schema: ActionSchema,
    payload: any
  ) => {
    const action = schema.actionFrom(payload);
    const ack = await mru.submitAction(transition, action);
    const { logs, errors } = await ack.waitFor(ActionConfirmationStatus.C1);
    if (errors?.length) {
      throw new Error(errors[0].message);
    }
    return logs;
  };

  app.post("/:transition", async (req, res) => {
    const { transition } = req.params;
    const schema = stfSchemaMap[transition];

    const { inputs, signature, msgSender } = req.body;

    try {
      const logs = await handleAction(transition, schema, {
        inputs,
        signature,
        msgSender,
      });
      return res.json({
        isOk: true,
        logs,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ isOk: false, error: error });
    }
  });




  // Start the express server
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

main();
