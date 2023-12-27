"use server";

import { parseUnit } from "@ckb-lumos/bi";
import { depositDao } from "@/lib/cobuild/publishers";
import { configFromEnv } from "@/lib/config";

export default async function deposit(_prevState, formData, config) {
  config = config ?? configFromEnv(process.env);

  const from = formData.get("from");
  const amount = parseUnit(formData.get("amount"), "ckb");

  try {
    const buildingPacket = await depositDao(config)({ from, amount });
    return {
      buildingPacket,
    };
  } catch (err) {
    return {
      error: err.toString(),
    };
  }
}
