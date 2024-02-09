"use client";

import { Alert, Button, Checkbox, Label } from "flowbite-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import withdraw from "@/actions/withdraw";
import PackingVerifierHelpText from "@/components/packing-verifier-help-text";
import useCell from "@/hooks/use-cell";
import useHeader from "@/hooks/use-header";
import useTipHeader from "@/hooks/use-tip-header";

import Capacity from "@/components/capacity";
import {
  DaoCycleProgress,
  DaoCycleProgressHint,
  daoCycleProgressColor,
} from "@/components/dao-cycle-progress";
import * as dao from "@/lib/dao";
import SignForm from "../../../sign-form";
import SubmitBuildingPacket from "../../../submit-building-packet";
import Loading from "./loading";

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

function CellDetails({
  cell,
  pending,
  onConfirm,
  shouldPackVerifier,
  setShouldPackVerifier,
}) {
  const tipHeader = useTipHeader();
  const depositHeader = useHeader(cell.blockHash);

  if (!tipHeader || !depositHeader) {
    return <Loading />;
  }

  const progress = dao.currentCycleProgress(tipHeader, depositHeader);
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
        <Checkbox
          className="mr-2 inline-block"
          id="packVerifier"
          name="packVerifier"
          checked={shouldPackVerifier}
          onChange={(e) => {
            setShouldPackVerifier(e.target.checked);
          }}
        />
        <Label htmlFor="packVerifier">
          Pack Verifier (<PackingVerifierHelpText />)
        </Label>
      </p>
      <CellDetailsDisplay {...{ progress, cell, tipHeader, depositHeader }} />
    </>
  );
}

function LoadCell({
  outPoint,
  pending,
  onConfirm,
  shouldPackVerifier,
  setShouldPackVerifier,
}) {
  const cell = useCell(outPoint);
  const childProps = {
    cell,
    pending,
    onConfirm,
    shouldPackVerifier,
    setShouldPackVerifier,
  };
  return cell ? <CellDetails {...childProps} /> : <Loading />;
}

export default function WithdrawForm({
  wallet,
  connection,
  address,
  outPoint,
  config,
}) {
  const router = useRouter();
  const [formState, setFormState] = useState({});
  const [pending, setPending] = useState(false);
  const [shouldPackVerifier, setShouldPackVerifier] = useState(false);
  const [signedBuildingPacket, setSignedBuildingPacket] = useState(null);
  const back = () => router.back();
  const onConfirm = async (cell) => {
    setPending(true);
    try {
      setFormState(await withdraw(address, cell, shouldPackVerifier));
    } catch (err) {
      setFormState({ error: err.toString() });
    }
    setPending(false);
  };

  if (
    formState.buildingPacket === null ||
    formState.buildingPacket === undefined
  ) {
    const childProps = {
      outPoint,
      pending,
      onConfirm,
      shouldPackVerifier,
      setShouldPackVerifier,
    };
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
