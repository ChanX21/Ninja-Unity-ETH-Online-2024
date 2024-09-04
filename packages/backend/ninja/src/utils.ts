import { ActionSchema, AllowedInputTypes } from "@stackr/sdk";
import { HDNodeWallet } from "ethers";

export const signMessage = async (
  wallet: HDNodeWallet,
  schema: ActionSchema,
  payload: AllowedInputTypes
) => {
  const signature = await wallet.signTypedData(
    schema.domain,
    schema.EIP712TypedData.types,
    payload
  );
  return signature;
};

export const parseInput = (inputStr : string) => {
  return inputStr.split(":").map(coord => {
      // Remove parsing with considering delimiter
      const cleanCoord = coord.replace(/[()]/g, "").split(",");
      return [Number(cleanCoord[0]), Number(cleanCoord[1])];
  });
}

// Function to check if a player has won, NOTE : parameters should be properly parsed with the above function before input
export const checkWin = (playerHits:any, opponentPlacements:any) => {
  const hitsSet = new Set(playerHits.map((coord: any[]) => `${coord[0]}:${coord[1]}`));

  for (let placement of opponentPlacements) {
      const placementKey = `${placement[0]}:${placement[1]}`;
      if (!hitsSet.has(placementKey)) {
          return false; // logic needs to improve
      }
  }
  return true; // logic to be improved
}