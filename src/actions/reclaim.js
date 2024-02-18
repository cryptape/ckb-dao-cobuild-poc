"use server";

import { reclaimDaoVerifiers } from "@/lib/cobuild/publishers";
import { getConfig } from "@/lib/config";
import { prepareLockActions } from "@/lib/cobuild/lock-actions";
import { payFee } from "@/lib/cobuild/fee-manager";

export default async function reclaim(from, config) {
  config = config ?? getConfig();

  try {
    let buildingPacket = await reclaimDaoVerifiers(config)({ from });
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
