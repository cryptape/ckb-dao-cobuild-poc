import { RPC } from "@ckb-lumos/rpc";
import { BI } from "@ckb-lumos/bi";
import { common as commonScripts, dao } from "@ckb-lumos/common-scripts";
import { blockchain } from "@ckb-lumos/base";
import { bytes, number } from "@ckb-lumos/codec";
import * as lumosHelpers from "@ckb-lumos/helpers";

import { getCellWithoutCache } from "@/actions/get-cell";
import {
  getDepositBlockNumberFromWithdrawCell,
  packDaoWitnessArgs,
} from "@/lib/dao";
import { mergeBuildingPacketFromSkeleton } from "@/lib/lumos-adapter/create-building-packet-from-skeleton";
import createSkeletonFromBuildingPacket from "@/lib/lumos-adapter/create-skeleton-from-building-packet";

import { DaoActionData } from "./schema";
import {
  getDaoScriptInfo,
  getDaoScriptHash,
  getDaoScriptInfoHash,
} from "./script-info";

function buildCellDep(scriptInfo) {
  return {
    outPoint: {
      txHash: scriptInfo.TX_HASH,
      index: scriptInfo.INDEX,
    },
    depType: scriptInfo.DEP_TYPE,
  };
}

function addDistinctCellDep(list, ...items) {
  return pushDistinctBy(
    list,
    items,
    (a, b) =>
      a.outPoint.txHash === b.outPoint.txHash &&
      a.outPoint.index === b.outPoint.index &&
      a.depType === b.depType,
  );
}
function addDistinctHeaderDep(list, ...items) {
  return pushDistinctBy(list, items, (a, b) => a === b);
}

function pushDistinctBy(list, items, eq) {
  const newItems = items.filter(
    (newItem) =>
      list.find((existingItem) => eq(existingItem, newItem)) === undefined,
  );
  return newItems.length > 0 ? list.push(...newItems) : list;
}

const DAO_CYCLE = BI.from(180);
// 4 hours
const ESITMATED_EPOCH_DURATION = BI.from(4 * 60 * 60 * 1000);

function parseEpoch(epoch) {
  return {
    length: epoch.shr(40).and(0xfff),
    index: epoch.shr(24).and(0xfff),
    number: epoch.and(0xffffff),
  };
}

function computeWaitingMilliseconds(from, to) {
  let fromEpoch = parseEpoch(BI.from(from.epoch));
  let toEpoch = parseEpoch(BI.from(to.epoch));

  let fromEpochPassedDuration = fromEpoch.index
    .mul(ESITMATED_EPOCH_DURATION)
    .div(fromEpoch.length);
  let toEpochPassedDuration = toEpoch.index
    .mul(ESITMATED_EPOCH_DURATION)
    .div(toEpoch.length);

  // find next cycle
  let remainingEpochsDraft = DAO_CYCLE.sub(
    toEpoch.number.sub(fromEpoch.number).mod(DAO_CYCLE),
  );
  let remainingEpochs =
    remainingEpochsDraft.eq(DAO_CYCLE) &&
    toEpoch.number.gt(fromEpoch.number) &&
    fromEpochPassedDuration.gte(toEpochPassedDuration)
      ? BI.from(0)
      : remainingEpochsDraft;

  return remainingEpochs
    .mul(ESITMATED_EPOCH_DURATION)
    .add(fromEpochPassedDuration)
    .sub(toEpochPassedDuration)
    .toHexString();
}

async function onDeposit({ ckbChainConfig }, txSkeleton, op) {
  const { from, to, amount } = op;

  const fromAddress = lumosHelpers.encodeToAddress(from, {
    config: ckbChainConfig,
  });
  const toAddress = lumosHelpers.encodeToAddress(to, {
    config: ckbChainConfig,
  });

  txSkeleton = await dao.deposit(
    txSkeleton,
    fromAddress,
    toAddress,
    amount.shannons,
    {
      config: ckbChainConfig,
    },
  );

  // dao in @ckb-lumos/common-scripts only inject capacity for the secp256k1 lock, so do it manually.
  txSkeleton = await commonScripts.injectCapacity(
    txSkeleton,
    [fromAddress],
    amount.shannons,
    fromAddress,
    undefined,
    { config: ckbChainConfig },
  );

  return [txSkeleton, op];
}

async function onWithdraw({ ckbChainConfig, ckbRpcUrl }, txSkeleton, op) {
  const { cellPointer } = op;
  const rpc = new RPC(ckbRpcUrl);

  const cell = await getCellWithoutCache(cellPointer, { ckbRpcUrl });
  const depositHeader = await rpc.getHeader(cell.blockHash);
  const safeWithdrawBlockNumber = BI.from(await rpc.getTipBlockNumber()).sub(
    24,
  );
  const estimatedWithdrawHeader = safeWithdrawBlockNumber.gt(
    BI.from(depositHeader.number),
  )
    ? await rpc.getHeaderByNumber(safeWithdrawBlockNumber.toHexString())
    : depositHeader;
  const from = cell.cellOutput.lock;

  const fromAddress = lumosHelpers.encodeToAddress(from, {
    config: ckbChainConfig,
  });

  // dao.withdraw only adds input from secp256k1, so add input manually
  txSkeleton = await commonScripts.setupInputCell(
    txSkeleton,
    cell,
    fromAddress,
    {
      config: ckbChainConfig,
    },
  );
  if (op.to !== undefined) {
    txSkeleton.updateIn(
      ["outputs", txSkeleton.get("outputs").size - 1],
      (output) => ({
        ...output,
        cellOutput: {
          ...output.cellOutput,
          lock: op.to,
        },
      }),
    );
  }
  // let dao.withdraw helps to add cellDeps
  txSkeleton = await dao.withdraw(txSkeleton, cell, fromAddress, {
    config: ckbChainConfig,
  });

  // Add header dep for withdraw estimation
  while (txSkeleton.get("witnesses").size < txSkeleton.get("inputs").size - 1) {
    txSkeleton = txSkeleton.update("witnesses", (witnesses) =>
      witnesses.push("0x"),
    );
  }
  // add header deps
  txSkeleton = txSkeleton.update("headerDeps", (headerDeps) =>
    addDistinctHeaderDep(headerDeps, estimatedWithdrawHeader.hash),
  );
  const estimatedWithdrawHeaderDepIndex = txSkeleton.get("headerDeps").size - 1;
  txSkeleton = txSkeleton.updateIn(["witnesses", 0], (witness) => {
    let unpackedWitnessArgs =
      witness === "0x" ? {} : blockchain.WitnessArgs.unpack(witness);
    let newWitnessArgs = {
      ...unpackedWitnessArgs,
      inputType: bytes.hexify(
        number.Uint64LE.pack(estimatedWithdrawHeaderDepIndex),
      ),
    };
    return bytes.hexify(blockchain.WitnessArgs.pack(newWitnessArgs));
  });

  return [
    txSkeleton,
    {
      ...op,
      from,
      to: op.to ?? from,
      depositInfo: {
        amount: { shannons: cell.cellOutput.capacity },
        depositBlockNumber: depositHeader.number,
        depositTimestamp: {
          unixMilliseconds: depositHeader.timestamp,
        },
      },
      estimatedWithdrawInfo: {
        waitingMilliseconds: computeWaitingMilliseconds(
          depositHeader,
          estimatedWithdrawHeader,
        ),
        withdrawInfo: {
          withdrawBlockNumber: estimatedWithdrawHeader.number,
          withdrawTimestamp: {
            unixMilliseconds: estimatedWithdrawHeader.timestamp,
          },
          componsationAmount: {
            shannons: BI.from(
              dao.calculateMaximumWithdraw(
                cell,
                depositHeader.dao,
                estimatedWithdrawHeader.dao,
              ),
            )
              .sub(cell.cellOutput.capacity)
              .toHexString(),
          },
        },
      },
    },
  ];
}

async function onClaim({ ckbRpcUrl, ckbChainConfig }, txSkeleton, op) {
  const { cellPointer } = op;
  const rpc = new RPC(ckbRpcUrl);

  const cell = await getCellWithoutCache(cellPointer, { ckbRpcUrl });
  const depositBlockNumber = getDepositBlockNumberFromWithdrawCell(cell);
  const depositBlockHash = await rpc.getBlockHash(depositBlockNumber);
  const depositHeader = await rpc.getHeader(depositBlockHash);
  const withdrawHeader = await rpc.getHeader(cell.blockHash);

  const from = cell.cellOutput.lock;
  const fromAddress = lumosHelpers.encodeToAddress(from, {
    config: ckbChainConfig,
  });
  const to = op.to ?? from;

  // add input
  const since =
    "0x" +
    dao
      .calculateDaoEarliestSince(depositHeader.epoch, withdrawHeader.epoch)
      .toString(16);
  txSkeleton = await commonScripts.setupInputCell(
    txSkeleton,
    cell,
    fromAddress,
    {
      config: ckbChainConfig,
    },
  );
  const txSkeletonMutable = txSkeleton.asMutable();
  txSkeletonMutable.update("inputSinces", (inputSinces) =>
    inputSinces.set(txSkeletonMutable.get("inputs").size - 1, since),
  );

  // add output
  const outCapacity =
    "0x" +
    dao
      .calculateMaximumWithdraw(cell, depositHeader.dao, withdrawHeader.dao)
      .toString(16);
  op = { ...op, totalClaimedCapacity: outCapacity };
  txSkeletonMutable.updateIn(
    ["outputs", txSkeletonMutable.get("outputs").size - 1],
    () => ({
      cellOutput: {
        capacity: outCapacity,
        type: null,
        lock: to,
      },
      data: "0x",
    }),
  );

  // add cell deps
  txSkeletonMutable.update("cellDeps", (cellDeps) =>
    addDistinctCellDep(cellDeps, buildCellDep(ckbChainConfig.SCRIPTS.DAO)),
  );
  // add header deps
  txSkeletonMutable.update("headerDeps", (headerDeps) =>
    addDistinctHeaderDep(headerDeps, depositBlockHash, cell.blockHash),
  );

  // add witness
  const depositBlockPos = txSkeletonMutable
    .get("headerDeps")
    .indexOf(depositBlockHash);
  txSkeletonMutable.updateIn(
    ["witnesses", txSkeletonMutable.get("witnesses").size - 1],
    () => packDaoWitnessArgs(depositBlockPos),
  );

  return [
    txSkeletonMutable.asImmutable(),
    {
      ...op,
      from,
      to,
      depositInfo: {
        amount: { shannons: cell.cellOutput.capacity },
        depositBlockNumber: depositHeader.number,
        depositTimestamp: {
          unixMilliseconds: depositHeader.timestamp,
        },
      },
      withdrawInfo: {
        withdrawBlockNumber: withdrawHeader.number,
        withdrawTimestamp: {
          unixMilliseconds: withdrawHeader.timestamp,
        },
        componsationAmount: {
          shannons: BI.from(
            dao.calculateMaximumWithdraw(
              cell,
              depositHeader.dao,
              withdrawHeader.dao,
            ),
          )
            .sub(cell.cellOutput.capacity)
            .toHexString(),
        },
      },
    },
  ];
}

export async function willAddAction(config, buildingPacket, actionData) {
  let txSkeleton = createSkeletonFromBuildingPacket(buildingPacket, config);

  const newActionData = { deposits: [], withdraws: [], claims: [] };
  for (const [i, deposit] of actionData.deposits.entries()) {
    const [newTxSkeleton, newDeposit] = await onDeposit(
      config,
      txSkeleton,
      deposit,
    );
    txSkeleton = newTxSkeleton;
    newActionData.deposits[i] = newDeposit;
  }
  for (const [i, withdraw] of actionData.withdraws.entries()) {
    const [newTxSkeleton, newWithdraw] = await onWithdraw(
      config,
      txSkeleton,
      withdraw,
    );
    txSkeleton = newTxSkeleton;
    newActionData.withdraws[i] = newWithdraw;
  }
  for (const [i, claim] of actionData.claims.entries()) {
    const [newTxSkeleton, newClaim] = await onClaim(config, txSkeleton, claim);
    txSkeleton = newTxSkeleton;
    newActionData.claims[i] = newClaim;
  }

  const newBuildingPacket = mergeBuildingPacketFromSkeleton(
    buildingPacket,
    txSkeleton,
  );

  const action = {
    scriptHash: getDaoScriptHash(config),
    scriptInfoHash: getDaoScriptInfoHash(config),
    data: bytes.hexify(DaoActionData.pack(newActionData)),
  };
  const scriptInfo = getDaoScriptInfo(config);

  return {
    type: newBuildingPacket.type,
    value: {
      ...newBuildingPacket.value,
      message: {
        actions: [...newBuildingPacket.value.message.actions, action],
      },
      scriptInfos: [...newBuildingPacket.value.scriptInfos, scriptInfo],
    },
  };
}

export function bindCallbacks(config) {
  return {
    willAddAction: willAddAction.bind(null, config),
  };
}

export default bindCallbacks;
