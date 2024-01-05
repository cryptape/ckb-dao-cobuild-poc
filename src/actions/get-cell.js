"use server";

import { cache } from "react";
import { getConfig } from "@/lib/config";
import { RPC } from "@ckb-lumos/rpc";

export async function getCellWithoutCache(outPoint, config) {
  const { ckbRpcUrl } = config ?? getConfig();

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
  const blockHash = txResp.txStatus.blockHash;
  const headerResp = await rpc.getHeader(blockHash);

  return {
    outPoint,
    blockHash,
    blockNumber: headerResp.number,
    cellOutput: liveCellResp.cell.output,
    data: liveCellResp.cell.data.content,
  };
}

export const getCellWithCache = cache(getCellWithoutCache);
