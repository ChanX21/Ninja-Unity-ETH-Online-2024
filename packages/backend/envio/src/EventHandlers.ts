/*
 * Please refer to https://docs.envio.dev for a thorough guide on all Envio indexer features
 */
import {
  Escrow,
  Escrow_Deposited,
  Escrow_MinEthRequiredUpdated,
  Escrow_OwnershipTransferred,
  Escrow_Released,
} from "generated";

Escrow.Deposited.handler(async ({ event, context }) => {
  const entity: Escrow_Deposited = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    user: event.params.user,
    amount: event.params.amount,
    escrowType: event.params.escrowType,
    escrowId: event.params.escrowId,
  };

  context.Escrow_Deposited.set(entity);
});


Escrow.MinEthRequiredUpdated.handler(async ({ event, context }) => {
  const entity: Escrow_MinEthRequiredUpdated = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    oldMinEthRequired: event.params.oldMinEthRequired,
    newMinEthRequired: event.params.newMinEthRequired,
  };

  context.Escrow_MinEthRequiredUpdated.set(entity);
});


Escrow.OwnershipTransferred.handler(async ({ event, context }) => {
  const entity: Escrow_OwnershipTransferred = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    previousOwner: event.params.previousOwner,
    newOwner: event.params.newOwner,
  };

  context.Escrow_OwnershipTransferred.set(entity);
});


Escrow.Released.handler(async ({ event, context }) => {
  const entity: Escrow_Released = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    winner: event.params.winner,
    amount: event.params.amount,
    escrowId: event.params.escrowId,
  };

  context.Escrow_Released.set(entity);
});

