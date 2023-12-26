"use client";

import { useEffect, useState } from "react";
import { Button, Spinner, Alert } from "flowbite-react";

import sendTx from "@/actions/send-tx";

function isDone({ txStatus: { status } }) {
  return status === "committed" || status === "rejected";
}

function sendUntilDone(tx, setState) {
  let aborted = false;
  let timeout = null;

  const fn = () => {
    sendTx(tx).then((state) => {
      if (!aborted) {
        setState(state);
        if (!isDone(state)) {
          timeout = setTimeout(fn, 3000);
        }
      }
    });
  };
  fn();

  return () => {
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    aborted = true;
  };
}

export function TxStatus({ txHash, txStatus, ckbChainConfig }) {
  return (
    <>
      {txHash ? (
        <p className="break-all">
          Tx Hash: <TxHash txHash={txHash} ckbChainConfig={ckbChainConfig} />
        </p>
      ) : null}
      {txStatus.status === "committed"
        ? TxCommitted({ txStatus })
        : txStatus.status !== "rejected"
          ? TxPending({ txStatus })
          : TxRejected({ txStatus })}
    </>
  );
}

export function TxHash({ txHash, ckbChainConfig: { EXPLORER_URL } }) {
  return EXPLORER_URL ? (
    <a href={`${EXPLORER_URL}/transaction/${txHash}`}>{txHash}</a>
  ) : (
    <span>{txHash}</span>
  );
}

export function TxCommitted({ txStatus }) {
  return (
    <Alert color="success">
      <span className="font-medium">Committed!</span>
    </Alert>
  );
}

export function TxRejected({ txStatus }) {
  return (
    <Alert color="failure">
      <span className="font-medium">Rejected!</span> {txStatus.reason}
    </Alert>
  );
}
export function TxPending({ txStatus }) {
  return (
    <div>
      <Spinner /> {txStatus.status}
    </div>
  );
}

export default function SubmitBuildingPacket({
  buildingPacket,
  onClose,
  ckbChainConfig,
}) {
  const tx = buildingPacket.value.payload;

  const [txState, setTxState] = useState({
    txHash: null,
    txStatus: {
      status: "pending",
      reason: null,
    },
  });
  useEffect(() => sendUntilDone(tx, setTxState), [tx, setTxState]);
  const color =
    txState && txState.txStatus.status === "committed" ? undefined : "light";

  return (
    <>
      <p>
        <Button color={color} onClick={onClose}>
          Close
        </Button>
      </p>

      <TxStatus ckbChainConfig={ckbChainConfig} {...txState} />
    </>
  );
}
