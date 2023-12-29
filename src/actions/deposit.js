"use server";

import { parseUnit } from "@ckb-lumos/bi";
import { depositDao } from "@/lib/cobuild/publishers";
import { useConfig } from "@/lib/config";
import { prepareLockActions } from "@/lib/cobuild/lock-actions";
import { payFee } from "@/lib/cobuild/fee-manager";

export default async function deposit(_prevState, formData, config) {
  config = config ?? useConfig();

  const from = formData.get("from");
  const amount = parseUnit(formData.get("amount"), "ckb");

  try {
    let buildingPacket = await depositDao(config)({ from, amount });
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
