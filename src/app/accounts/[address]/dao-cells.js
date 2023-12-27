"use client";

import Link from "next/link";
import { Button } from "flowbite-react";

import Capacity from "@/components/capacity";
import DaoCycleProgress from "@/components/dao-cycle-progress";
import * as dao from "@/lib/dao";
import useHeaderByNumber from "@/hooks/use-header-by-number";
import useTipHeader from "@/hooks/use-tip-header";
import Loading from "./loading";

function cellKey(cell) {
  return `${cell.outPoint.txHash.substring(2)}/${parseInt(
    cell.outPoint.index,
    16,
  )}`;
}

export function DepositRow({ address, cell, tipHeader }) {
  const depositHeader = useHeaderByNumber(cell.blockNumber);
  const key = cellKey(cell);

  return (
    <tr key={key}>
      <td>
        <Capacity value={cell.cellOutput.capacity} />
      </td>
      {tipHeader && depositHeader ? (
        <>
          <td>
            +<Capacity value={dao.reward(cell, depositHeader, tipHeader)} />
          </td>
          <td>{dao.duration(depositHeader, tipHeader).humanize()}</td>
          <td>
            <DaoCycleProgress
              progress={dao.currentCycleProgress(tipHeader, depositHeader)}
            />
          </td>
        </>
      ) : (
        <td colSpan="3" className="text-center">
          <Loading />
        </td>
      )}
      <td>
        <Button
          as={Link}
          href={`/accounts/${address}/withdraw/${key}`}
          color="light"
          className="not-prose inline-block"
        >
          Withdraw
        </Button>
      </td>
    </tr>
  );
}

export function DepositsTable({ address, cells, tipHeader }) {
  return (
    <table className="table-auto">
      <thead>
        <tr>
          <th>Base</th>
          <th>Reward</th>
          <th>Duration</th>
          <th className="w-1/2">Current Cycle</th>
          <th>&nbsp;</th>
        </tr>
      </thead>
      <tbody>
        {cells.map((cell) => DepositRow({ address, cell, tipHeader }))}
      </tbody>
    </table>
  );
}

export function WithdrawRow({ address, cell, tipHeader }) {
  const depositBlockNumber = dao.getDepositBlockNumberFromWithdrawCell(cell);
  const depositHeader = useHeaderByNumber(depositBlockNumber);
  const withdrawHeader = useHeaderByNumber(cell.blockNumber);
  const waitingDuration =
    tipHeader && depositHeader && withdrawHeader
      ? dao.estimateWithdrawWaitingDurationUntil(
          tipHeader,
          depositHeader,
          withdrawHeader,
        )
      : null;
  const key = cellKey(cell);

  return (
    <tr key={key}>
      <td>
        <Capacity value={cell.cellOutput.capacity} />
      </td>
      <td>
        {tipHeader && depositHeader ? (
          <>
            +<Capacity value={dao.reward(cell, depositHeader, tipHeader)} />
          </>
        ) : (
          <Loading />
        )}
      </td>
      <td>
        {waitingDuration ? (
          <p>Waiting for {waitingDuration.humanize()}</p>
        ) : (
          <Button
            as={Link}
            color="green"
            href={`/accounts/${address}/claim/${key}`}
            className="not-prose inline-block"
          >
            Claim
          </Button>
        )}
      </td>
    </tr>
  );
}

export function WithdrawsTable({ address, cells, tipHeader }) {
  return (
    <table className="table-auto">
      <thead>
        <tr>
          <th>Base</th>
          <th>Reward</th>
          <th>&nbsp;</th>
        </tr>
      </thead>
      <tbody>
        {cells.map((cell) => WithdrawRow({ address, cell, tipHeader }))}
      </tbody>
    </table>
  );
}

export default function DaoCells({ address, daoCells }) {
  const tipHeader = useTipHeader();
  const { deposits, withdraws } = daoCells;
  return (
    <>
      <h3>Deposits</h3>
      <DepositsTable address={address} cells={deposits} tipHeader={tipHeader} />
      <h3>Withdraws</h3>
      <WithdrawsTable
        address={address}
        cells={withdraws}
        tipHeader={tipHeader}
      />
    </>
  );
}
