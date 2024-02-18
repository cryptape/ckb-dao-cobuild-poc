import { buildCellDep, buildScript } from "@/lib/config";
import { getDaoPappRegistry } from "@/lib/papps/dao/registry";
import {
  createBuildingPacketByCreator,
  createBuildingPacketByFormDataCreator,
} from "@/lib/papps/papp";
import { BI } from "@ckb-lumos/bi";
import { Indexer } from "@ckb-lumos/ckb-indexer";
import { common as commonScripts } from "@ckb-lumos/common-scripts";
import { TransactionSkeleton, addressToScript } from "@ckb-lumos/helpers";

import createBuildingPacketFromSkeleton from "./create-building-packet-from-skeleton";
import initLumosCommonScripts from "./init-lumos-common-scripts";

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

    reclaimDaoVerifiers: async function ({ from }) {
      let txSkeleton = TransactionSkeleton({
        cellProvider: indexer,
      });

      const verifierScript = buildScript(
        ckbChainConfig.SCRIPTS.DAO_ACTION_VERIFIER,
        "0x",
      );
      const lock = addressToScript(from, { config: ckbChainConfig });
      const collector = indexer.collector({
        lock,
        argsLen: (lock.args.length - 2) / 2,
        type: verifierScript,
      });
      let outputCapacity = BI.from(0);
      for await (const cell of collector.collect()) {
        outputCapacity = outputCapacity.add(BI.from(cell.cellOutput.capacity));
        txSkeleton = await commonScripts.setupInputCell(
          txSkeleton,
          cell,
          from,
          {
            config: ckbChainConfig,
          },
        );
      }
      txSkeleton = txSkeleton.update("outputs", (outputs) =>
        outputs.clear().push({
          cellOutput: {
            lock,
            capacity: outputCapacity.toHexString(),
          },
          data: "0x",
        }),
      );

      txSkeleton = txSkeleton.update("cellDeps", (cellDeps) =>
        cellDeps.push(buildCellDep(ckbChainConfig.SCRIPTS.DAO_ACTION_VERIFIER)),
      );

      return createBuildingPacketFromSkeleton(txSkeleton);
    },
  };
}
