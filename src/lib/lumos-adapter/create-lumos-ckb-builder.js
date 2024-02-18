import { Indexer } from "@ckb-lumos/ckb-indexer";
import { TransactionSkeleton } from "@ckb-lumos/helpers";
import { common as commonScripts } from "@ckb-lumos/common-scripts";

import {
  createBuildingPacketByFormDataCreator,
  createBuildingPacketByCreator,
} from "@/lib/papps/papp";
import { getDaoPappRegistry } from "@/lib/papps/dao/registry";

import initLumosCommonScripts from "./init-lumos-common-scripts";
import createBuildingPacketFromSkeleton from "./create-building-packet-from-skeleton";

export default function createLumosCkbBuilder(config) {
  const { ckbRpcUrl, ckbChainConfig } = config;
  initLumosCommonScripts(ckbChainConfig);
  const indexer = new Indexer(ckbRpcUrl);
  const dao = getDaoPappRegistry(config);

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

      // lumos always add the target output first
      return createBuildingPacketFromSkeleton(txSkeleton);
    },

    depositDao: async function (formData) {
      return await createBuildingPacketByFormDataCreator(
        dao,
        "deposit",
        formData,
      );
    },

    withdrawDao: async function ({ cell }) {
      return await createBuildingPacketByCreator(dao, "withdraw", {
        cellPointer: cell.outPoint,
      });
    },

    claimDao: async function ({ cell }) {
      return await createBuildingPacketByCreator(dao, "claim", {
        cellPointer: cell.outPoint,
      });
    },
  };
}
