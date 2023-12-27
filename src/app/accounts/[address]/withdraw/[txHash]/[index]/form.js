"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button } from "flowbite-react";

import withdraw from "@/actions/withdraw";
import useTipHeader from "@/hooks/use-tip-header";
import useHeader from "@/hooks/use-header";
import useCell from "@/hooks/use-cell";

import Capacity from "@/components/capacity";
import {
  DaoCycleProgress,
  DaoCycleProgressHint,
  daoCycleProgressColor,
} from "@/components/dao-cycle-progress";
import * as dao from "@/lib/dao";
import Loading from "./loading";
import SignForm from "../../../sign-form";
import SubmitBuildingPacket from "../../../submit-building-packet";

function CellDetailsDisplay({ progress, cell, depositHeader, tipHeader }) {
  return (
    <dl>
      <dd className="px-0">
        <DaoCycleProgressHint progress={progress} />
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
      </dd>
    </dl>
  );
}

function CellDetails({ cell, pending, onConfirm }) {
  const tipHeader = useTipHeader();
  const depositHeader = useHeader(cell.blockHash);

  if (!tipHeader || !depositHeader) {
    return <Loading />;
  }

  const progress = dao.currentCycleProgress(depositHeader, tipHeader);
  const color = daoCycleProgressColor(progress);

  return (
    <>
      <p>
        <Button
          color={color}
          isProcessing={pending}
          disabled={pending}
          onClick={() => onConfirm(cell)}
        >
          Confirm Withdraw
        </Button>
      </p>
      <CellDetailsDisplay {...{ progress, cell, tipHeader, depositHeader }} />
    </>
  );
}

function LoadCell({ outPoint, pending, onConfirm }) {
  const cell = useCell(outPoint);
  const childProps = { cell, pending, onConfirm };
  return cell ? <CellDetails {...childProps} /> : <Loading />;
}

export default function WithdrawForm({ address, outPoint, config }) {
  const router = useRouter();
  const [formState, setFormState] = useState({});
  const [pending, setPending] = useState(false);
  const [signedBuildingPacket, setSignedBuildingPacket] = useState(null);
  const back = () => router.back();
  const onConfirm = async (cell) => {
    setPending(true);
    try {
      setFormState(await withdraw(address, cell));
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
