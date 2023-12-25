import { Indexer } from "@ckb-lumos/ckb-indexer";
import { TransactionSkeleton } from "@ckb-lumos/helpers";
import { common as commonScripts } from "@ckb-lumos/common-scripts";

import initLumosCommonScripts from "./init-lumos-common-scripts";
import createBuildingPacketFromSkeleton from "./create-building-packet-from-skeleton";

export default function createLumosCkbBuilder({ ckbRpcUrl, ckbChainConfig }) {
  initLumosCommonScripts(ckbChainConfig);
  const indexer = new Indexer(ckbRpcUrl);

  return {
    transferCkb: async function ({ from, to, amount, feeRate = 1000 }) {
      let txSkeleton = TransactionSkeleton({
        cellProvider: indexer,
      });

      txSkeleton = await commonScripts.transfer(
        txSkeleton,
        [from],
        to,
        amount,
        from,
        undefined,
        {
          config: ckbChainConfig,
        },
      );

      txSkeleton = await commonScripts.payFeeByFeeRate(
        txSkeleton,
        [from],
        feeRate,
        undefined,
        {
          config: ckbChainConfig,
        },
      );

      return createBuildingPacketFromSkeleton(txSkeleton);
    },
  };
}
