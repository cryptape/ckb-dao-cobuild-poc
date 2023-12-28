"use server";

import { cache } from "react";
import { useConfig } from "@/lib/config";
import { RPC } from "@ckb-lumos/rpc";

export async function getTipHeaderWithoutCache(config) {
  const { ckbRpcUrl } = config ?? useConfig();
  const rpc = new RPC(ckbRpcUrl);

  return await rpc.getTipHeader();
}

export const getTipHeaderWithCache = cache(getTipHeaderWithoutCache);
