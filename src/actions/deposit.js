"use server";

import { parseUnit } from "@ckb-lumos/bi";
import { depositDao } from "@/lib/cobuild/publishers";
import { getConfig } from "@/lib/config";
import { prepareLockActions } from "@/lib/cobuild/lock-actions";
import { payFee } from "@/lib/cobuild/fee-manager";

export default async function deposit(_prevState, formData, config) {
  config = config ?? getConfig();

  const from = formData.get("from");

  try {
    let buildingPacket = await depositDao(config)(formData);
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
