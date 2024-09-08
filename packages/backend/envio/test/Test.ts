import assert from "assert";
import { 
  TestHelpers,
  Escrow_Deposited
} from "generated";
const { MockDb, Escrow } = TestHelpers;

describe("Escrow contract Deposited event tests", () => {
  // Create mock db
  const mockDb = MockDb.createMockDb();

  // Creating mock for Escrow contract Deposited event
  const event = Escrow.Deposited.createMockEvent({/* It mocks event fields with default values. You can overwrite them if you need */});

  it("Escrow_Deposited is created correctly", async () => {
    // Processing the event
    const mockDbUpdated = await Escrow.Deposited.processEvent({
      event,
      mockDb,
    });

    // Getting the actual entity from the mock database
    let actualEscrowDeposited = mockDbUpdated.entities.Escrow_Deposited.get(
      `${event.chainId}_${event.block.number}_${event.logIndex}`
    );

    // Creating the expected entity
    const expectedEscrowDeposited: Escrow_Deposited = {
      id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
      user: event.params.user,
      amount: event.params.amount,
      escrowType: event.params.escrowType,
      escrowId: event.params.escrowId,
    };
    // Asserting that the entity in the mock database is the same as the expected entity
    assert.deepEqual(actualEscrowDeposited, expectedEscrowDeposited, "Actual EscrowDeposited should be the same as the expectedEscrowDeposited");
  });
});
