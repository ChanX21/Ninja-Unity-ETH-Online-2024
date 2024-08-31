import { MicroRollup } from "@stackr/sdk";
import { stackrConfig } from "../../stackr.config";
import { machine } from "./machine";
import { CreateGameSchema, JoinGameSchema, TrackMoveSchema } from "./schemas";

const mru = await MicroRollup({
  config: stackrConfig,
  actionSchemas: [JoinGameSchema, CreateGameSchema, TrackMoveSchema],
  stateMachines: [machine],
});

await mru.init();

export { mru };
