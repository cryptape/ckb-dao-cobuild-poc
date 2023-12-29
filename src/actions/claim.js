"use server";

import { claimDao } from "@/lib/cobuild/publishers";
import { useConfig } from "@/lib/config";
import { prepareLockActions } from "@/lib/cobuild/lock-actions";
import { payFee } from "@/lib/cobuild/fee-manager";

export default async function withdraw(from, cell, config) {
  config = config ?? useConfig();

  try {
    let buildingPacket = await claimDao(config)({ from, cell });
    buildingPacket = await payFee(
      buildingPacket,
      [{ address: from, feeRate: 1200 }],
      config,
    );
    buildingPacket = prepareLockActions(buildingPacket, config.ckbChainConfig);

    return {
      buildingPacket,
    };
  } catch (err) {
    return {
      error: err.toString(),
    };
  }
}
