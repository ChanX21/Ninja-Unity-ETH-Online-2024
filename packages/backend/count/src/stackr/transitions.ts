import { STF, Transitions } from "@stackr/sdk/machine";
import { CounterState } from "./state";

const increment: STF<CounterState> = {
  handler: ({ state, emit }) => {
    state += 1;
    emit({ name: "ValueAfterIncrement", value: state });
    return state;
  },
};

const decrement: STF<CounterState> = {
  handler: ({ state, emit }) => {
    state -= 1;
    emit({ name: "ValueAfterDecrement", value: state });
    return state;
  },
};

const startGame: STF<CounterState> = {
  handler: ({ state, emit }) => {
    state -= 1;
    emit({ name: "gameStarted", value: state });
    return state;
  },
};

const endGame: STF<CounterState> = {
  handler: ({ state, emit }) => {
    state -= 1;
    emit({ name: "gameEnded", value: state });
    return state;
  },
};

const trackMove: STF<CounterState> = {
  handler: ({ state, emit }) => {
    state -= 1;
    emit({ name: "move", value: state });
    return state;
  },
};

export const transitions: Transitions<CounterState> = {
  increment,
  decrement,
};
