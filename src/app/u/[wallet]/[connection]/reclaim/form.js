"use client";

import { BI, formatUnit } from "@ckb-lumos/bi";
import { Alert, Button, Checkbox, Label } from "flowbite-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import reclaim from "@/actions/reclaim";
import useVerifierCells from "@/hooks/use-verifier-cells";

import SignForm from "../sign-form";
import SubmitBuildingPacket from "../submit-building-packet";

function FormDisplay({ pending, onConfirm, verifierCells }) {
  let lockedCapacity = BI.from(0);
  if (verifierCells !== undefined) {
    for (const cell of verifierCells) {
      lockedCapacity = lockedCapacity.add(BI.from(cell.cellOutput.capacity));
    }
  }

  return (
    <>
      <p>
        <Button
          isProcessing={pending || verifierCells === undefined}
          disabled={pending || verifierCells === undefined}
          onClick={() => onConfirm()}
        >
          Confirm
        </Button>
      </p>
      {lockedCapacity.gt(0) ? (
        <p>
          You can reclaim {formatUnit(lockedCapacity, "ckb")} CKB from{" "}
          {verifierCells.length} {verifierCells.length == 1 ? "cell" : "cells"}.
        </p>
      ) : null}
    </>
  );
}

export default function WithdrawForm({ wallet, connection, address, config }) {
  const router = useRouter();
  const verifierCells = useVerifierCells(address);
  const [formState, setFormState] = useState({});
  const [pending, setPending] = useState(false);
  const [signedBuildingPacket, setSignedBuildingPacket] = useState(null);
  const back = () => router.back();
  const onConfirm = async () => {
    setPending(true);
    try {
      setFormState(await reclaim(address));
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
      pending,
      onConfirm,
      verifierCells,
    };
    return (
      <>
        {formState.error ? (
          <Alert className="mb-5" color="failure">
            {formState.error}
          </Alert>
        ) : null}
        <FormDisplay {...childProps} />
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
