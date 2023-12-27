"use client";

import { Button } from "flowbite-react";

import useTipHeader from "@/hooks/use-tip-header";
import useHeader from "@/hooks/use-header";
import useCell from "@/hooks/use-cell";

import Capacity from "@/components/capacity";
import DaoCycleProgress, {
  WARNING_THRESHOLD,
} from "@/components/dao-cycle-progress";
import * as dao from "@/lib/dao";
import Loading from "./loading";

function WithdrawHint({ progress }) {
  const waitingDuration = dao.estimateWithdrawWaitingDuration(progress);

  if (progress >= WARNING_THRESHOLD) {
    return (
      <p>
        The current cycle is about to finish in {waitingDuration.humanize()}. If
        the chain fails to accept your withdraw request before the cycle
        finishes, you have to wait another cycle to claim the withdraw.
      </p>
    );
  } else {
    return (
      <p>
        You have to wait for {waitingDuration.humanize()} before claiming the
        withdraw. You won't get reward during this waiting period.
      </p>
    );
  }
}

function CellLoaded({ address, cell }) {
  const tipHeader = useTipHeader();
  const depositHeader = useHeader(cell.blockHash);

  if (!tipHeader || !depositHeader) {
    return <Loading />;
  }

  const progress = dao.currentCycleProgress(depositHeader, tipHeader);

  return (
    <dl>
      <dd className="px-0">
        <Button>Confirm Withdraw</Button>
      </dd>
      <dt>Base</dt>
      <dd>
        <Capacity value={cell.cellOutput.capacity} />
      </dd>
      <dt>Reward</dt>
      <dd>
        +<Capacity value={dao.reward(cell, depositHeader, tipHeader)} />
      </dd>
      <dt>Duration</dt>
      <dd>{dao.duration(depositHeader, tipHeader).humanize()}</dd>
      <dt>Current Cycle</dt>
      <dd>
        <DaoCycleProgress progress={progress} />
        <WithdrawHint progress={progress} />
      </dd>
    </dl>
  );
}

export default function Withdraw({ params: { address, txHash, index } }) {
  const outPoint = {
    txHash: `0x${txHash}`,
    index: `0x${index.toString(16)}`,
  };
  const cell = useCell(outPoint);

  return (
    <main>
      <h2>Withdraw</h2>
      {cell ? <CellLoaded address={address} cell={cell} /> : <Loading />}
    </main>
  );
}
