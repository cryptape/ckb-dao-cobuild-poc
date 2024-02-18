"use server";

import { claimDao } from "@/lib/cobuild/publishers";
import { getConfig } from "@/lib/config";
import { prepareLockActions } from "@/lib/cobuild/lock-actions";
import { payFee } from "@/lib/cobuild/fee-manager";
import { prepareVerifier } from "@/lib/papps/dao/verifier";

export default async function withdraw(from, cell, shouldPackVerifier, config) {
  config = config ?? getConfig();

  try {
    let buildingPacket = await claimDao(config)({ cell });
    if (shouldPackVerifier) {
      buildingPacket = await prepareVerifier(buildingPacket, from, config);
    }
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
    console.error(err.stack);
    return {
      error: err.toString(),
    };
  }
}
