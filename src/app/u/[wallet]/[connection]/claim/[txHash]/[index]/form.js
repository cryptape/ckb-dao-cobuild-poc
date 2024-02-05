"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button } from "flowbite-react";

import claim from "@/actions/claim";
import useTipHeader from "@/hooks/use-tip-header";
import useHeader from "@/hooks/use-header";
import useHeaderByNumber from "@/hooks/use-header-by-number";
import useCell from "@/hooks/use-cell";

import Capacity from "@/components/capacity";
import * as dao from "@/lib/dao";
import Loading from "./loading";
import SignForm from "../../../sign-form";
import SubmitBuildingPacket from "../../../submit-building-packet";

function CellDetailsDisplay({ cell, depositHeader, withdrawHeader }) {
  return (
    <dl>
      <dt>Base</dt>
      <dd>
        <Capacity value={cell.cellOutput.capacity} />
      </dd>
      <dt>Reward</dt>
      <dd>
        +<Capacity value={dao.reward(cell, depositHeader, withdrawHeader)} />
      </dd>
    </dl>
  );
}

function CellDetails({ cell, pending, onConfirm }) {
  const tipHeader = useTipHeader();
  const depositBlockNumber = dao.getDepositBlockNumberFromWithdrawCell(cell);
  const depositHeader = useHeaderByNumber(depositBlockNumber);
  const withdrawHeader = useHeader(cell.blockHash);

  if (!tipHeader || !depositHeader || !withdrawHeader) {
    return <Loading />;
  }

  const waitingDuration = dao.estimateWithdrawWaitingDurationUntil(
    tipHeader,
    depositHeader,
    withdrawHeader,
  );

  return (
    <>
      <p>
        {waitingDuration ? (
          `Waiting for ${waitingDuration.humanize()}`
        ) : (
          <Button
            color="green"
            isProcessing={pending}
            disabled={pending}
            onClick={() => onConfirm(cell)}
          >
            Claim Now
          </Button>
        )}
      </p>
      <CellDetailsDisplay
        {...{ cell, tipHeader, withdrawHeader, depositHeader }}
      />
    </>
  );
}

function LoadCell({ outPoint, pending, onConfirm }) {
  const cell = useCell(outPoint);
  const childProps = { cell, pending, onConfirm };
  return cell ? <CellDetails {...childProps} /> : <Loading />;
}

export default function ClaimForm({
  wallet,
  connection,
  address,
  outPoint,
  config,
}) {
  const router = useRouter();
  const [formState, setFormState] = useState({});
  const [pending, setPending] = useState(false);
  const [signedBuildingPacket, setSignedBuildingPacket] = useState(null);
  const back = () => router.back();
  const onConfirm = async (cell) => {
    setPending(true);
    try {
      setFormState(await claim(address, cell));
    } catch (err) {
      setFormState({ error: err.toString() });
    }
    setPending(false);
  };

  if (
    formState.buildingPacket === null ||
    formState.buildingPacket === undefined
  ) {
    const childProps = { outPoint, pending, onConfirm };
    return (
      <>
        {formState.error ? (
          <Alert className="mb-5" color="failure">
            {formState.error}
          </Alert>
        ) : null}
        <LoadCell {...childProps} />
      </>
    );
  } else if (
    signedBuildingPacket === null ||
    signedBuildingPacket === undefined
  ) {
    return (
      <SignForm
        wallet={wallet}
        connection={connection}
        address={address}
        buildingPacket={formState.buildingPacket}
        ckbChainConfig={config.ckbChainConfig}
        onSubmit={setSignedBuildingPacket}
        onCancel={back}
      />
    );
  } else {
    return (
      <SubmitBuildingPacket
        buildingPacket={signedBuildingPacket}
        ckbChainConfig={config.ckbChainConfig}
        onClose={back}
      />
    );
  }
}
