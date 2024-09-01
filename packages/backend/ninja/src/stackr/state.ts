import { State } from "@stackr/sdk/machine";
import { BytesLike, solidityPackedKeccak256 } from "ethers";


export interface RawState {
  games: {
    gameId: string;
    player1: string;
    player2: string;
    createdAt: number;
    startedAt: number;
    endedAt: number;
    status: "in_lobby" | "in_play" | "ended" ;
    lastMove:string;
    lastPlayer: string;
  }[];
}


export class NinjaStrikeState extends State<RawState> {
  constructor(state: RawState) {
    super(state);
  }

  // Here since the state is simple and doesn't need wrapping, we skip the transformers to wrap and unwrap the state

  // transformer() {
  //   return {
  //     wrap: () => this.state,
  //     unwrap: (wrappedState: number) => wrappedState,
  //   };
  // }

  
  getRootHash(): BytesLike {
    return solidityPackedKeccak256(
      ["string"],
      [JSON.stringify(this.state.games)]
    );
}
}
