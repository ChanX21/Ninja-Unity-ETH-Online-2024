import { ActionConfirmationStatus } from "@stackr/sdk";
import { Wallet } from "ethers";
import { mru } from "./stackr/mru.ts";
import { UpdateCounterSchema } from "./stackr/schemas.ts";
import { signMessage } from "./utils.ts";
import { Playground } from "@stackr/sdk/plugins";
import express from "express";

const PORT = process.env.PORT || 3210;


const main = async () => {

  const app = express();
  app.use(express.json({ limit: "50mb" }));
  // allow CORS
  app.use((_req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
    next();
  });

  console.log("started server.....")

  const inputs = {
    timestamp: Date.now(),
  };

  // Create a random wallet
  const wallet = Wallet.createRandom();

  const signature = await signMessage(wallet, UpdateCounterSchema, inputs);
  const incrementAction = UpdateCounterSchema.actionFrom({
    inputs,
    signature,
    msgSender: wallet.address,
  });

  Playground.init(mru);

  

  // const ack = await mru.submitAction("increment", incrementAction);
  // console.log(ack);

  // // leverage the ack to wait for C1 and access logs & error from STF execution
  // const { logs, errors } = await ack.waitFor(ActionConfirmationStatus.C1);
  // console.log({ logs, errors });
};

main();
