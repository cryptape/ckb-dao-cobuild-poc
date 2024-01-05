"use server";

import { cache } from "react";
import { getConfig } from "@/lib/config";
import { RPC } from "@ckb-lumos/rpc";

export async function getHeaderWithoutCache(blockHash, config) {
  const { ckbRpcUrl } = config ?? getConfig();
  const rpc = new RPC(ckbRpcUrl);

  return await rpc.getHeader(blockHash);
}

export const getHeaderWithCache = cache(getHeaderWithoutCache);
