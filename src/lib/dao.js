import moment from "moment";
import { BI } from "@ckb-lumos/bi";
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

export function currentCycleProgress(depositHeader, withdrawHeader) {
  const start = decomposeEpoch(depositHeader.epoch);
  const end = decomposeEpoch(withdrawHeader.epoch);

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

export function estimateWithdrawWaitingDuration(progress) {
  const remaningHours =
    (DAO_CYCLE_EPOCHS.toNumber() * HOURS_PER_EPOCH * (100 - progress)) / 100;
  return moment.duration(remaningHours, "h");
}
