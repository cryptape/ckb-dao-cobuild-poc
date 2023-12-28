import moment from "moment";
import { BI } from "@ckb-lumos/bi";
import { number, bytes } from "@ckb-lumos/codec";
import { blockchain } from "@ckb-lumos/base";
import { dao } from "@ckb-lumos/common-scripts";

const DAO_CYCLE_EPOCHS = BI.from(180);
const HOURS_PER_EPOCH = 4;
const HUNDRED = BI.from(100);

function decomposeEpoch(epoch) {
  epoch = BI.from(epoch);
  return {
    length: epoch.shr(40).and(0xfff),
    index: epoch.shr(24).and(0xfff),
    number: epoch.and(0xffffff),
  };
}

export function reward(cell, depositHeader, withdrawHeader) {
  const total = dao.calculateMaximumWithdraw(
    cell,
    depositHeader.dao,
    withdrawHeader.dao,
  );
  return BI.from(total).sub(BI.from(cell.cellOutput.capacity));
}

export function duration(depositHeader, withdrawHeader) {
  const startTime = moment(BI.from(depositHeader.timestamp).toNumber());
  const endTime = moment(BI.from(withdrawHeader.timestamp).toNumber());
  return moment.duration(endTime.diff(startTime));
}

export function getDepositBlockNumberFromWithdrawCell(cell) {
  return BI.from(number.Uint64.unpack(cell.data)).toHexString();
}

// Pack witness for withdraw phase 2 tx.
// depositHeaderIndex - cellDeps index of the block hash in which the deposit tx is committed.
export function packDaoWitnessArgs(depositHeaderIndex) {
  const witnessArgs = {
    inputType: bytes.hexify(number.Uint64LE.pack(depositHeaderIndex)),
  };
  return bytes.hexify(blockchain.WitnessArgs.pack(witnessArgs));
}

export function currentCycleProgress(tipHeader, depositHeader) {
  const start = decomposeEpoch(depositHeader.epoch);
  const end = decomposeEpoch(tipHeader.epoch);

  const epochDiff = end.number.sub(start.number).mod(DAO_CYCLE_EPOCHS);
  const commonDenominator = end.length.mul(start.length);
  const fractionDiff = end.index
    .mul(start.length)
    .sub(start.index.mul(end.length));
  const progress = epochDiff
    .mul(commonDenominator)
    .add(fractionDiff)
    .mul(HUNDRED)
    .div(commonDenominator)
    .div(DAO_CYCLE_EPOCHS);
  const modProgress = progress.isNegative()
    ? progress.add(HUNDRED)
    : progress.mod(HUNDRED);
  return modProgress.toNumber();
}

function _toJson(epoch) {
  return {
    length: epoch.length.toNumber(),
    index: epoch.index.toNumber(),
    number: epoch.number.toNumber(),
  };
}

export function estimateWithdrawWaitingDurationUntil(
  tipHeader,
  depositHeader,
  withdrawHeader,
) {
  const earliestClaimEpoch = BI.from(
    dao.calculateDaoEarliestSince(depositHeader.epoch, withdrawHeader.epoch),
  );
  const start = decomposeEpoch(tipHeader.epoch);
  const end = decomposeEpoch(earliestClaimEpoch);

  const epochDiff = end.number.sub(start.number);
  if (epochDiff.isNegative()) {
    return null;
  }

  const commonDenominator = end.length.mul(start.length);
  const fractionDiff = end.index
    .mul(start.length)
    .sub(start.index.mul(end.length));
  const remainingHours = epochDiff
    .mul(commonDenominator)
    .add(fractionDiff)
    .mul(HOURS_PER_EPOCH)
    .div(commonDenominator);

  return moment.duration(remainingHours, "h");
}

export function estimateWithdrawWaitingDuration(progress) {
  const remainingHours =
    (DAO_CYCLE_EPOCHS.toNumber() * HOURS_PER_EPOCH * (100 - progress)) / 100;
  return moment.duration(remainingHours, "h");
}
