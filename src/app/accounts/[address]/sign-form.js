"use client";

import { Button } from "flowbite-react";
import { addressToScript } from "@ckb-lumos/helpers";

import * as joyid from "@/lib/wallet/joyid";
import BuildingPacketReview from "@/lib/cobuild/react/building-packet-review";
import {
  prepareLockActions,
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
  const preparedBuildingPacket = prepareLockActions(
    buildingPacket,
    ckbChainConfig,
  );
  const lockScript = addressToScript(address, { config: ckbChainConfig });
  const lockAction = findLockActionByLockScript(
    preparedBuildingPacket,
    lockScript,
  );
  const lockActionData = GeneralLockAction.unpack(lockAction.data);
  const sign = async () => {
    const seal = await joyid.sign(
      address,
      lockActionData.digest.substring(2),
      ckbChainConfig,
    );
    onSubmit(
      finalizeWitnesses(applyLockAction(buildingPacket, lockAction, seal)),
    );
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button onClick={sign}>Sign</Button>
        <Button color="light" onClick={onCancel}>
          Cancel
        </Button>
      </div>
      <BuildingPacketReview
        buildingPacket={preparedBuildingPacket}
        lockActionData={lockActionData}
      />
    </>
  );
}
