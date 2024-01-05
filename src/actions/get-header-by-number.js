"use server";

import { cache } from "react";
import { getConfig } from "@/lib/config";
import { RPC } from "@ckb-lumos/rpc";

export async function getHeaderByNumberWithoutCache(blockNumber, config) {
  const { ckbRpcUrl } = config ?? getConfig();
  const rpc = new RPC(ckbRpcUrl);

  return await rpc.getHeaderByNumber(blockNumber);
}

export const getHeaderByNumberWithCache = cache(getHeaderByNumberWithoutCache);
