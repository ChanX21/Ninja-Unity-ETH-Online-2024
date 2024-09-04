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
    hitCountP1: number;
    hitCountP2: number;
    winner: string;
  }[];
}


export class NinjaStrikeState extends State<RawState> {
  constructor(state: RawState) {
    super(state);
  }

  // Helper function to hash an individual game using keccak256
  private hashGame(game: any): BytesLike {
    return solidityPackedKeccak256(["string"], [JSON.stringify(game)]);
  }

  // Function to merkelize the games array and return the Merkle root
  getRootHash(): BytesLike {
    // Hash each game in the games array
    let hashes = this.state.games.map((game) => this.hashGame(game));

    // If there are no games, return an empty hash
    if (hashes.length === 0) {
      return solidityPackedKeccak256(["string"], [""]);
    }

    // If there's only one game, return its hash
    if (hashes.length === 1) {
      return hashes[0];
    }

    // Combine hashes in pairs until we get the Merkle root
    while (hashes.length > 1) {
      let nextLevel: BytesLike[] = [];

      for (let i = 0; i < hashes.length; i += 2) {
        if (i + 1 < hashes.length) {
          // Hash pairs of elements together
          const combinedHash = solidityPackedKeccak256(
            ["bytes32", "bytes32"],
            [hashes[i], hashes[i + 1]]
          );
          nextLevel.push(combinedHash);
        } else {
          // If there is an odd number of elements, move the last one to the next level
          nextLevel.push(hashes[i]);
        }
      }

      hashes = nextLevel;
    }

    // The final hash is the Merkle root
    return hashes[0];
  }
}
