import { StateMachine } from "@stackr/sdk/machine";

import * as genesisState from "../../genesis-state.json";
import { NinjaStrikeState } from "./state";
import { transitions } from "./transitions";

const machine = new StateMachine({
  id: "ninja-strike",
  stateClass: NinjaStrikeState,
  initialState: genesisState.state,
  on: transitions,
});

export { machine };
