"use server";

import { parseUnit } from "@ckb-lumos/bi";
import { transferCkb } from "@/lib/cobuild/publishers";
import { prepareLockActions } from "@/lib/cobuild/lock-actions";
import { payFee } from "@/lib/cobuild/fee-manager";
import { getConfig } from "@/lib/config";

export default async function transfer(_prevState, formData, config) {
  config = config ?? getConfig();

  const from = formData.get("from");
  const to = formData.get("to");
  const amount = parseUnit(formData.get("amount"), "ckb");

  try {
    let buildingPacket = await transferCkb(config)({
      from,
      to,
      amount,
    });
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
