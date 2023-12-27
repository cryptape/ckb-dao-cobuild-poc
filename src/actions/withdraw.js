"use server";

import { withdrawDao } from "@/lib/cobuild/publishers";
import { configFromEnv } from "@/lib/config";

export default async function withdraw(from, cell, config) {
  config = config ?? configFromEnv(process.env);

  try {
    const buildingPacket = await withdrawDao(config)({ from, cell });
    return {
      buildingPacket,
    };
  } catch (err) {
    return {
      error: err.toString(),
    };
  }
}
