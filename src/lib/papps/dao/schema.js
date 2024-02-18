import { blockchain } from "@ckb-lumos/base";
import { molecule, number } from "@ckb-lumos/codec";
const { Uint64 } = number;
const { struct, table, vector, option } = molecule;
const { Script, OutPoint } = blockchain;

const Address = Script;

export const MESSAGE_TYPE = "DaoActionData";
export const SCHEMA = `
array Uint32 [byte; 4];
array Uint64 [byte; 8];

array Byte32 [byte; 32];
vector Bytes <byte>;

struct Capacity {
    shannons: Uint64,
}
struct Timestamp {
    unix_milliseconds: Uint64,
}

table Address {
    code_hash: Byte32,
    hash_type: byte,
    args: Bytes,
}

struct OutPoint {
    tx_hash: Byte32,
    index: Uint32,
}

struct DepositInfo {
    amount: Capacity,
    deposit_block_number: Uint64,
    deposit_timestamp: Timestamp,
}

struct WithdrawInfo {
    withdraw_block_number: Uint64,
    withdraw_timestamp: Timestamp,
    componsation_amount: Capacity,
}

struct EstimatedWithdrawInfo {
    waiting_milliseconds: Uint64,
    withdraw_info: WithdrawInfo,
}

option EstimatedWithdrawInfoOpt (EstimatedWithdrawInfo);

table Deposit {
    from: Address,
    to: Address,
    amount: Capacity,
}

table Withdraw {
    cell_pointer: OutPoint,
    from: Address,
    to: Address,
    deposit_info: DepositInfo,
    estimated_withdraw_info: EstimatedWithdrawInfoOpt,
}

table Claim {
    cell_pointer: OutPoint,
    from: Address,
    to: Address,
    deposit_info: DepositInfo,
    withdraw_info: WithdrawInfo,
}

vector DepositVec <Deposit>;
vector WithdrawVec <Withdraw>;
vector ClaimVec <Claim>;

table DaoActionData {
    deposits: DepositVec,
    withdraws: WithdrawVec,
    claims: ClaimVec,
}
`;

export const Capacity = struct(
  {
    shannons: Uint64,
  },
  ["shannons"],
);

export const Timestamp = struct(
  {
    unixMilliseconds: Uint64,
  },
  ["unixMilliseconds"],
);

export const DepositInfo = table(
  {
    amount: Capacity,
    depositBlockNumber: Uint64,
    depositTimestamp: Timestamp,
  },
  ["amount", "depositBlockNumber", "depositTimestamp"],
);

export const WithdrawInfo = struct(
  {
    withdrawBlockNumber: Uint64,
    withdrawTimestamp: Timestamp,
    componsationAmount: Capacity,
  },
  ["withdrawBlockNumber", "withdrawTimestamp", "componsationAmount"],
);

export const EstimatedWithdrawInfo = struct(
  {
    waitingMilliseconds: Uint64,
    withdrawInfo: WithdrawInfo,
  },
  ["waitingMilliseconds", "withdrawInfo"],
);

export const EstimatedWithdrawInfoOpt = option(EstimatedWithdrawInfo);

export const Deposit = table(
  {
    from: Address,
    to: Address,
    amount: Capacity,
  },
  ["from", "to", "amount"],
);

export const Withdraw = table(
  {
    cellPointer: OutPoint,
    from: Address,
    to: Address,
    depositInfo: DepositInfo,
    estimatedWithdrawInfo: EstimatedWithdrawInfoOpt,
  },
  ["cellPointer", "from", "to", "depositInfo", "estimatedWithdrawInfo"],
);

export const Claim = table(
  {
    cellPointer: OutPoint,
    from: Address,
    to: Address,
    depositInfo: DepositInfo,
    withdrawInfo: WithdrawInfo,
  },
  ["cellPointer", "from", "to", "depositInfo", "withdrawInfo"],
);

export const DepositVec = vector(Deposit);
export const WithdrawVec = vector(Withdraw);
export const ClaimVec = vector(Claim);

export const DaoActionData = table(
  {
    deposits: DepositVec,
    withdraws: WithdrawVec,
    claims: ClaimVec,
  },
  ["deposits", "withdraws", "claims"],
);

export default DaoActionData;
