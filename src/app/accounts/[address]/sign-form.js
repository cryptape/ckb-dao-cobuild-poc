"use client";

import { Button } from "flowbite-react";

import BuildingPacketReview from "@/lib/cobuild/react/building-packet-review";
import { applyLockActions } from "@/lib/cobuild/lock-actions";

export default function SignForm({ address, buildingPacket, ckbChainConfig }) {
  const appliedBuildingPacket = applyLockActions(
    buildingPacket,
    ckbChainConfig,
  );

  return (
    <>
      <Button>Sign</Button>
      <BuildingPacketReview buildingPacket={appliedBuildingPacket} />
    </>
  );
}
