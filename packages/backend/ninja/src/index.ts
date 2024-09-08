import { ActionConfirmationStatus, ActionSchema } from "@stackr/sdk";
import { Wallet } from "ethers";
import { mru } from "./stackr/mru.ts";
import { JoinGameSchema, TrackMoveSchema, CreateGameSchema, EndGameSchema } from "./stackr/schemas.ts";
import { signMessage } from "./utils.ts";
import { Playground } from "@stackr/sdk/plugins";
import express, { Request, Response } from "express";
import { transitions } from "./stackr/transitions.ts";
import * as schemas from "./stackr/schemas.ts";
import { machine } from "./stackr/machine.ts";

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

  // Create a random wallet
  const wallet = Wallet.createRandom();
  console.log("Wallet Address Player 1:", wallet.address);
  const wallet2 = Wallet.createRandom();
  console.log("Wallet Address Player 2:", wallet2.address);
  // const stackrReferee = new Wallet(process.env.STACKR_REFEREE_PVTKEY? process.env.STACKR_REFEREE_PVTKEY : "")

  // Playground initialization
  Playground.init(mru);

  const machineI = mru.stateMachines.getFirst<typeof machine>();

  // New Endpoint to Get Signature Based on Action
  app.post("/stackr/sign/:action", async (req: Request, res: Response) => {
    const { action } = req.params;
    const schema = stfSchemaMap[action];
  
    if (!schema) {
      return res.status(400).json({ success: false, message: "Invalid action" });
    }
  
    const { playerNo, gameId, move, hit } = req.body;
  
    // Choose the wallet based on playerNo or any other logic
    const walletNow = playerNo === 1 ? wallet : wallet2;
  
    try {
      let timestamp = Date.now();
  
      // Construct the payload dynamically based on the schema for the given action
      let payload: any = { timestamp };
  
      if (action === "createGame") {
        // payload.player1 = walletNow.address;
      } else if (action === "joinGame" || action === "endGame") {
        payload.gameId = gameId;
      } else if (action === "trackMove") {
        payload.gameId = gameId;
        payload.move = move;
        payload.hit = hit;
      }
  
      // Add any other fields required by the schema, if needed
      const signature = await signMessage(walletNow, schema, payload);
      return res.json({ success: true, signature, timestamp, player : walletNow.address });
    } catch (error) {
      console.error("Error signing message:", error);
      return res.status(500).json({ success: false, error: error.message });
    }
  });
  

  const stfSchemaMap: Record<string, ActionSchema> = {
    createGame: CreateGameSchema,
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

  app.post("/stackr/:reducer", async (req, res) => {
    const { reducer } = req.params;
    console.log({ reducer })

    const { inputs, signature, msgSender } = req.body;

    const actionReducer = transitions[reducer];

    if (!actionReducer) {
      res.status(400).send({ message: "NO_REDUCER_FOR_ACTION" });
      return;
    }

    const schema = stfSchemaMap[reducer];
    console.log({ schema });


    try {
      const logs = await handleAction(reducer, schema, {
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

  app.get("/info", (_req: Request, res: Response) => {
    const transitionToSchema = mru.getStfSchemaMap();
    const { name, version, chainId, verifyingContract, salt } =
      mru.config.domain;
    res.send({
      signingInstructions: "signTypedData(domain, schema.types, inputs)",
      // IMPORTANT: don't change the order of the properties in the domain object
      domain: {
        name,
        version,
        chainId,
        verifyingContract,
        salt,
      },
      transitionToSchema,
      schemas: Object.values(schemas).reduce(
        (acc, schema) => {
          acc[schema.identifier] = {
            primaryType: schema.EIP712TypedData.primaryType,
            types: schema.EIP712TypedData.types,
          };
          return acc;
        },
        {} as Record<string, any>
      ),
    });
  });


  // Start the express server
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

};

main();
