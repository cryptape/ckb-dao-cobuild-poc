import { RPC } from "@ckb-lumos/rpc";
import { Indexer } from "@ckb-lumos/ckb-indexer";
import { TransactionSkeleton } from "@ckb-lumos/helpers";
import { common as commonScripts, dao } from "@ckb-lumos/common-scripts";

import initLumosCommonScripts from "./init-lumos-common-scripts";
import createBuildingPacketFromSkeleton from "./create-building-packet-from-skeleton";
import {
  getDepositBlockNumberFromWithdrawCell,
  packDaoWitnessArgs,
} from "../dao";

function buildCellDep(scriptInfo) {
  return {
    outPoint: {
      txHash: scriptInfo.TX_HASH,
      index: scriptInfo.INDEX,
    },
    depType: scriptInfo.DEP_TYPE,
  };
}

export default function createLumosCkbBuilder({ ckbRpcUrl, ckbChainConfig }) {
  initLumosCommonScripts(ckbChainConfig);
  const rpc = new RPC(ckbRpcUrl);
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

      // lumos always add the target output first
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

      return createBuildingPacketFromSkeleton(txSkeleton);
    },

    claimDao: async function ({ cell }) {
      const depositBlockNumber = getDepositBlockNumberFromWithdrawCell(cell);
      const depositBlockHash = await rpc.getBlockHash(depositBlockNumber);
      const depositHeader = await rpc.getHeader(depositBlockHash);
      const withdrawHeader = await rpc.getHeader(cell.blockHash);

      const txSkeletonMutable = TransactionSkeleton({
        cellProvider: indexer,
      }).asMutable();

      // add input
      const since =
        "0x" +
        dao
          .calculateDaoEarliestSince(depositHeader.epoch, withdrawHeader.epoch)
          .toString(16);
      txSkeletonMutable.update("inputs", (inputs) => inputs.push(cell));
      txSkeletonMutable.update("inputSinces", (inputSinces) =>
        inputSinces.set(0, since),
      );

      // add output
      const outCapacity =
        "0x" +
        dao
          .calculateMaximumWithdraw(cell, depositHeader.dao, withdrawHeader.dao)
          .toString(16);
      txSkeletonMutable.update("outputs", (outputs) =>
        outputs.push({
          cellOutput: {
            capacity: outCapacity,
            type: null,
            lock: cell.cellOutput.lock,
          },
          data: "0x",
        }),
      );

      // add cell deps
      txSkeletonMutable.update("cellDeps", (cellDeps) =>
        cellDeps.push(
          buildCellDep(ckbChainConfig.SCRIPTS.DAO),
          buildCellDep(ckbChainConfig.SCRIPTS.JOYID_COBUILD_POC),
        ),
      );
      // add header deps
      txSkeletonMutable.update("headerDeps", (headerDeps) =>
        headerDeps.push(depositBlockHash, cell.blockHash),
      );

      // add witness
      txSkeletonMutable.update("witnesses", (witnesses) =>
        witnesses.push(packDaoWitnessArgs(0)),
      );

      let txSkeleton = txSkeletonMutable.asImmutable();

      // Allow pay fee from the unlocked cell directly.
      return createBuildingPacketFromSkeleton(txSkeleton);
    },
  };
}
