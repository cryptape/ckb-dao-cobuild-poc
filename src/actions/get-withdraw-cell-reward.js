"use server";

import { cache } from "react";
import { RPC } from "@ckb-lumos/rpc";

import { getConfig } from "@/lib/config";
import * as dao from "@/lib/dao";

export async function getWithdrawCellRewardWithoutCache(outPoint, config) {
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

  const depositBlockNumber = dao.getDepositBlockNumberFromWithdrawCell({
    data: liveCellResp.cell.data.content,
  });
  const depositHeader = await rpc.getHeaderByNumber(depositBlockNumber);
  const txResp = await rpc.getTransaction(outPoint.txHash, "0x2", true);
  const withdrawBlockHash = txResp.txStatus.blockHash;
  const withdrawHeader = await rpc.getHeader(withdrawBlockHash);
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
