"use client";

import { useState } from "react";
import { Button, Alert } from "flowbite-react";
import { addressToScript } from "@ckb-lumos/helpers";

import * as joyid from "@/lib/wallet/joyid";
import useWithdrawCellRewards from "@/hooks/use-withdraw-cell-rewards";
import SubmitButton from "@/components/submit-button";
import BuildingPacketReview from "@/lib/cobuild/react/building-packet-review";
import {
  findLockActionByLockScript,
  finalizeWitnesses,
} from "@/lib/cobuild/lock-actions";
import {
  GeneralLockAction,
  applyLockAction,
} from "@/lib/cobuild/general-lock-actions";

export default function SignForm({
  address,
  buildingPacket,
  ckbChainConfig,
  onSubmit,
  onCancel,
}) {
  const [error, setError] = useState();
  const withdrawCellRewards = useWithdrawCellRewards(buildingPacket);
  const lockScript = addressToScript(address, { config: ckbChainConfig });
  const lockAction = findLockActionByLockScript(buildingPacket, lockScript);
  const lockActionData = GeneralLockAction.unpack(lockAction.data);
  const sign = async () => {
    try {
      const seal = await joyid.sign(
        address,
        lockActionData.digest.substring(2),
        ckbChainConfig,
      );
      onSubmit(
        finalizeWitnesses(applyLockAction(buildingPacket, lockAction, seal)),
      );
    } catch (err) {
      console.error(err.stack);
      setError(err.toString());
    }
  };

  return (
    <>
      {error ? (
        <Alert className="mb-5" color="failure">
          {error}
        </Alert>
      ) : null}
      <form action={sign} className="flex flex-wrap gap-2 mb-5">
        <SubmitButton>Sign</SubmitButton>
        <Button color="light" onClick={onCancel}>
          Cancel
        </Button>
      </form>
      <BuildingPacketReview
        buildingPacket={buildingPacket}
        lockActionData={lockActionData}
        address={address}
        ckbChainConfig={ckbChainConfig}
        withdrawCellRewards={withdrawCellRewards}
      />
    </>
  );
}
