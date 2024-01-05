"use server";

import { revalidatePath } from "next/cache";
import { RPC } from "@ckb-lumos/rpc";
import { blockchain, utils as lumosBaseUtils } from "@ckb-lumos/base";

import { useConfig } from "@/lib/config";

const { ckbHash } = lumosBaseUtils;

function shouldSend(txState) {
  if (txState === null || txState === undefined) {
    return true;
  }
  const status = txState.txStatus.status;
  return status === "unknown" || status === "rejected";
}

async function sendTxInner(tx, txHash, { ckbRpcUrl }) {
  const rpc = new RPC(ckbRpcUrl);

  const txState = await rpc.getTransaction(txHash, "0x1", false);
  if (shouldSend(txState)) {
    await rpc.sendTransaction(tx);
    return {
      txHash,
      txStatus: {
        status: `pending`,
      },
    };
  } else {
    return {
      txHash,
      txStatus: txState.txStatus,
    };
  }
}

export default async function sendTx(tx, config) {
  config = config ?? useConfig();
  const txHash = ckbHash(blockchain.RawTransaction.pack(tx));

  try {
    const txState = await sendTxInner(tx, txHash, config);
    if (txState.txStatus.status === "committed") {
      revalidatePath("/u/[wallet]/[connection]", "layout");
    }
    return txState;
  } catch (err) {
    return {
      txHash,
      txStatus: {
        status: "rejected",
        reason: err.toString(),
      },
    };
  }
}
