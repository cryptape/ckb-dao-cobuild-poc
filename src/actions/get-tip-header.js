"use server";

import { cache } from "react";
import { configFromEnv } from "@/lib/config";
import { RPC } from "@ckb-lumos/rpc";

export async function getTipHeaderWithoutCache(config) {
  const { ckbRpcUrl } = config ?? configFromEnv(process.env);
  const rpc = new RPC(ckbRpcUrl);

  return await rpc.getTipHeader();
}

export const getTipHeaderWithCache = cache(getTipHeaderWithoutCache);
