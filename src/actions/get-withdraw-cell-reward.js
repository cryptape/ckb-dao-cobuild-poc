"use server";

import { cache } from "react";
import { RPC } from "@ckb-lumos/rpc";

import { useConfig } from "@/lib/config";
import * as dao from "@lib/dao";

export async function getWithdrawCellRewardWithoutCache(
  outPoint,
  depositBlockHash,
  config,
) {
  const { ckbRpcUrl } = config ?? useConfig();
  const rpc = new RPC(ckbRpcUrl);

  const liveCellResp = await rpc.getLiveCell(outPoint, true);
  if (
    liveCellResp === null ||
    liveCellResp === undefined ||
    liveCellResp.status !== "live"
  ) {
    return null;
  }

  const txResp = await rpc.getTransaction(outPoint.txHash, "0x2", true);
  const withdrawBlockHash = txResp.txStatus.blockHash;
  const withdrawHeader = await rpc.getHeader(withdrawBlockHash);
  const depositHeader = await rpc.getHeader(depositBlockHash);
  const reward = dao.reward(
    {
      cellOutput: liveCellResp.cell.output,
    },
    depositHeader,
    withdrawHeader,
  );
  return reward.toHexString();
}

export const getWithdrawCellRewardWithCache = cache(
  getWithdrawCellRewardWithoutCache,
);
