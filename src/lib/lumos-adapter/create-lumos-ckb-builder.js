import { Indexer } from "@ckb-lumos/ckb-indexer";
import { TransactionSkeleton } from "@ckb-lumos/helpers";
import { common as commonScripts, dao } from "@ckb-lumos/common-scripts";

import initLumosCommonScripts from "./init-lumos-common-scripts";
import createBuildingPacketFromSkeleton from "./create-building-packet-from-skeleton";

// **Attention:** There's no witnesses set yet, so I set fee rate to 3000 to hope that the final tx fee rate will be larger than 1000.
async function payFee(txSkeleton, from, ckbChainConfig) {
  return await commonScripts.payFeeByFeeRate(
    txSkeleton,
    [from],
    3000,
    undefined,
    {
      config: ckbChainConfig,
    },
  );
}

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

      txSkeleton = await payFee(txSkeleton, from, ckbChainConfig);
      return createBuildingPacketFromSkeleton(txSkeleton);
    },

    depositDao: async function ({ from, amount }) {
      let txSkeleton = TransactionSkeleton({
        cellProvider: indexer,
      });

      txSkeleton = await dao.deposit(txSkeleton, from, from, amount, {
        config: ckbChainConfig,
      });
      // dao in @ckb-lumos/common-scripts only inject capacity for the secp256k1 lock, so do it manually.
      txSkeleton = await commonScripts.injectCapacity(
        txSkeleton,
        [from],
        amount,
        from,
        undefined,
        { config: ckbChainConfig },
      );

      txSkeleton = await payFee(txSkeleton, from, ckbChainConfig);
      return createBuildingPacketFromSkeleton(txSkeleton);
    },

    withdrawDao: async function ({ from, cell }) {
      let txSkeleton = TransactionSkeleton({
        cellProvider: indexer,
      });

      // dao.withdraw only adds input from secp256k1, so add input manually
      txSkeleton = await commonScripts.setupInputCell(txSkeleton, cell, from, {
        config: ckbChainConfig,
      });
      // let dao.withdraw helps to add cellDeps
      txSkeleton = await dao.withdraw(txSkeleton, cell, from, {
        config: ckbChainConfig,
      });

      txSkeleton = await payFee(txSkeleton, from, ckbChainConfig);
      return createBuildingPacketFromSkeleton(txSkeleton);
    },
  };
}
