"use server";

import { cache } from "react";
import { configFromEnv } from "@/lib/config";
import { RPC } from "@ckb-lumos/rpc";

export async function getCellWithoutCache(outPoint, config) {
  const { ckbRpcUrl } = config ?? configFromEnv(process.env);

  const rpc = new RPC(ckbRpcUrl);

  const liveCellResp = await rpc.getLiveCell(outPoint, true);
  if (
    liveCellResp === null ||
    liveCellResp === undefined ||
    liveCellResp.status !== "live"
  ) {
    return null;
  }

  const txResp = await rpc.getTransaction(outPoint.txHash, "0x1", true);

  return {
    outPoint,
    cellOutput: liveCellResp.cell.output,
    data: liveCellResp.cell.data.content,
    blockHash: txResp.txStatus.blockHash,
  };
}

export const getCellWithCache = cache(getCellWithoutCache);
