import { Progress, Tooltip } from "flowbite-react";

import { estimateWithdrawWaitingDuration } from "@/lib/dao";

export const WARNING_THRESHOLD = 98;
export const RECOMMENDING_THRESHOLD = 80;

export function daoCycleProgressColor(progress) {
  return progress >= WARNING_THRESHOLD
    ? "red"
    : progress >= RECOMMENDING_THRESHOLD
      ? "green"
      : "gray";
}

export function DaoCycleProgressHint({ progress }) {
  const waitingDuration = estimateWithdrawWaitingDuration(progress);
  return progress >= WARNING_THRESHOLD ? (
    <p>
      The current cycle is about to finish in {waitingDuration.humanize()}. If
      the chain fails to accept your withdraw request before the cycle finishes,
      you have to wait another cycle to claim the withdraw.
    </p>
  ) : (
    <p>
      You have to wait for {waitingDuration.humanize()} before claiming the
      withdraw. You won't get reward during this waiting period.
    </p>
  );
}

export function DaoCycleProgress({ progress, ...props }) {
  return (
    <Progress
      {...props}
      progress={Math.max(1, progress)}
      color={daoCycleProgressColor(progress)}
    >
      100
    </Progress>
  );
}

export default DaoCycleProgress;
