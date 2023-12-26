import { Indexer } from "@ckb-lumos/ckb-indexer";
import { TransactionSkeleton } from "@ckb-lumos/helpers";
import { common as commonScripts } from "@ckb-lumos/common-scripts";

import initLumosCommonScripts from "./init-lumos-common-scripts";
import createBuildingPacketFromSkeleton from "./create-building-packet-from-skeleton";

export default function createLumosCkbBuilder({ ckbRpcUrl, ckbChainConfig }) {
  initLumosCommonScripts(ckbChainConfig);
  const indexer = new Indexer(ckbRpcUrl);

  return {
    transferCkb: async function ({ from, to, amount }) {
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

      // **Attention:** There's no witnesses set yet, so I set fee rate to 3000 to hope that the final tx fee rate will be larger than 1000.
      txSkeleton = await commonScripts.payFeeByFeeRate(
        txSkeleton,
        [from],
        3000,
        undefined,
        {
          config: ckbChainConfig,
        },
      );

      return createBuildingPacketFromSkeleton(txSkeleton);
    },
  };
}
