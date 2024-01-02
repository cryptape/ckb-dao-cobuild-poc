import { blockchain } from "@ckb-lumos/base";
import { bytes, molecule, number } from "@ckb-lumos/codec";
const { Uint64 } = number;
const { table, vector, union } = molecule;
const { Script, ScriptOpt, OutPoint } = blockchain;

// Create a DAO deposit cell with the specific lock script and capacity. The ckb tokens come from the same lock script.
//
// This action is a shortcut of `DepositFrom` which `from` is the same as `lock`. See more details in the docs of `DepositFrom`.
export const Deposit = table(
  {
    lock: Script,
    capacity: Uint64,
  },
  ["lock", "capacity"],
);

// Create a DAO deposit cell with the specific lock script and capacity. The ckb tokens come from the lock script `from`.
//
// ## Builder
//
// If `from` is not `None`, the builder MUST add input cells that have the lock script `from`, empty type script and empty data. The total capacity of added input cells MUST be equal to or larger then `capacity`. If the total capacity is larger than `capacity`, the extra CKB tokens MUST be added to the change output. The builder MUST create the change output if there's no one set yet and the extra CKB tokens are enough to create the output.
//
// If `from` is `None`, the builder SHOULD NOT add inputs for this deposit.
//
// The builder MUST add the deposit cell as a new output cell with the cell data required by DAO rules.
//
// The builder MUST add cell deps for DAO but MAY not for the lock script.
//
// ## Verifier
//
// If `from` is `None`, the DAO tx verifier will not verify whether this deposit has been fully funded by a specific lock script. Otherwise see the section Capacity Verification in the docs of `DaoActionData`.
//
// The verifier MUST check the deposit cell exists in the outputs.
export const DepositFrom = table(
  {
    lock: Script,
    capacity: Uint64,
    from: ScriptOpt,
  },
  ["lock", "capacity", "from"],
);

// Create a DAO withdraw cell from the deposit cell referenced by `previousOutput`. The withdraw cell has the same lock script as the deposit cell.
//
// This action is a shortcut of `WithdrawTo` which `to` is the lock script of the deposit cell.
//
// Because of the rules of the DAO, the deposit cell must be at the same position in the outputs as the corresponding withdraw cell in the inputs.
export const Withdraw = table(
  {
    previousOutput: OutPoint,
  },
  ["previousOutput"],
);

// Create a DAO withdraw cell from the deposit cell referenced by `previousOutput`. The withdraw cell has the lock script `to`.
//
// Because of the rules of the DAO, the deposit cell must be at the same position in the outputs as the corresponding withdraw cell in the inputs and the lock script `to` must have the same size as the deposit cell lock script. In other words, their args fields must have the same length.
//
// ## Builder
//
// The builder MUST add the deposit cell as an input, and the withdraw cell as a output. The withdraw cell MUST have the lock script `to` and the same `capacity` as the deposit cell.
//
// The builder MUST abort if the existing transaction does not have the same number of inputs and outputs.
//
// The builder MUST set the withdraw cell data to the depositing block number, and add the depositing block hash to header deps.
//
// The builder MUST add cell deps for DAO but MAY not for the lock script.
//
// ## Verifier
//
// The verifier MUST check the deposit cell exists in the inputs, and the withdraw cell is at the same position in the outputs.
export const WithdrawTo = table(
  {
    previousOutput: OutPoint,
    to: Script,
  },
  ["previousOutput"],
);

// Claim locked CKB tokens and the DAO compensation from the DAO withdraw cell referenced by `previousOutput`. The recipient lock script is the same as the withdraw cell.
//
// This action is a shortcut of `ClaimTo` which `to` is the lock script of the withdraw cell. See more details in the docs of `ClaimTo`.
export const Claim = table(
  {
    previousOutput: OutPoint,
    // The sum of the locked CKB tokens and the DAO compensation.
    totalClaimedCapacity: Uint64,
  },
  ["previousOutput", "totalClaimedCapacity"],
);

// Claim locked CKB tokens and the DAO compensation from the DAO withdraw cell referenced by `previousOutput`. The recipient lock script is `to`.
//
// ## Builder
//
// The builder MUST add the withdraw cell as an input and set since to the earliest allowed epoch with fraction.
//
// If `to` is not `None`, the builder MUST create an output to receive all the claimed CKB tokens. The output MUST have empty type script and empty cell data. The output MUST be set as the change output if there's one set yet.
//
// If `to` is `None`, the builder MUST NOT create outputs to receive the claimed CKB tokens.
//
// The builder MUST add the depositing block hash and the withdrawing block hash to header deps. It MUST set the witness at the same position as the input withdraw cell to `WitnessArgs` and set the `input_type` field to the depositing block hash position in header deps.
//
// The builder MUST add cell deps for DAO but MAY not for the lock script.
//
// ## Verifier
//
// If `to` is `None`, the DAO tx verifier will not verify whether a recipient has fully received the claimed CKB tokens. Otherwise see the section Capacity Verification in the docs of `DaoActionData`.
//
// The verifier MUST check the withdraw cell exists in the inputs.
export const ClaimTo = table(
  {
    previousOutput: OutPoint,
    // The sum of the locked CKB tokens and the DAO componsation.
    totalClaimedCapacity: Uint64,
    to: ScriptOpt,
  },
  ["previousOutput", "totalClaimedCapacity", "to"],
);

// Perform a single DAO operation.
export const SingleOperation = union(
  {
    Deposit,
    DepositFrom,
    Withdraw,
    WithdrawTo,
    Claim,
    ClaimTo,
  },
  ["Deposit", "DepositFrom", "Withdraw", "WithdrawTo", "Claim", "ClaimTo"],
);

// Perform multiple DAO operations.
//
// Conflict operations are not allowed:
// - The Withdraw/WithdrawTo operations should not have the same previous output.
// - The Claim/ClaimTo operations should not have the same previous output.
//
// ## Builder
//
// Builder MUST perform the operations in the declared order.
export const MultipleOperations = vector(SingleOperation);

// The schema of the Action.data for DAO
//
// ## Verifier
//
// The verifier MUST check there are no two operations are using the same DAO withdraw cell or deposit cell. It must check there are no cells with the DAO type script that does not participate in the listed DAO operations.
//
// ### Capacity Verification
//
// For each lock script found in `Deposit.lock` and `DepositFrom.from` (not `None`), tally the expected fund and the actual fund.
//
// - For matched `Deposit.lock` and `DepositFrom.from`, add the `capacity` to the expected fund.
// - For each input having the lock script, add the `totalClaimedCapacity` to the actual fund if it is a DAO withdraw cell, otherwise add the cell `capacity` to the actual fund.
//
// The actual fund MUST be equal to or larger than the expected fund. Use `DepositFrom` and set `from` to None to bypass the verification.
//
// For each lock script found in the withdraw cell referenced by `Claim.previousOutput` and `Claim.to` (not `None`), tally the expected incoming and the actual incoming.
//
// - For matched `Claim.previousOutput` and `Claim.to`, add the `totalClaimedCapacity` to the expected incoming.
// - For each output having the lock script, add the cell `capacity` to the actual incoming.
//
// The sum of all positive (expected incoming - actual incoming) MUST be equal to or less than the transaction fee. Use `Claim` and set `to` to None to bypass this verification.
export const DaoActionData = union({ SingleOperation, MultipleOperations }, [
  "SingleOperation",
  "MultipleOperations",
]);

export default function buildScriptInfo({ url, scriptHash }) {
  return {
    name: bytes.bytifyRawString("DAO"),
    schema: "TODO: put molecule schema hash here",
    messageType: bytes.bytifyRawString("DaoActionData"),
    url,
    scriptHash,
  };
}
