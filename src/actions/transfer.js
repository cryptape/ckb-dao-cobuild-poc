"use server";

import { parseUnit } from "@ckb-lumos/bi";
import { transferCkb } from "@/lib/cobuild/publishers";
import { useConfig } from "@/lib/config";

export default async function transfer(_prevState, formData, config) {
  config = config ?? useConfig();

  const from = formData.get("from");
  const to = formData.get("to");
  const amount = parseUnit(formData.get("amount"), "ckb");

  try {
    const buildingPacket = await transferCkb(config)({ from, to, amount });
    return {
      buildingPacket,
    };
  } catch (err) {
    return {
      error: err.toString(),
    };
  }
}
