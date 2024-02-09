import { Indexer } from "@ckb-lumos/ckb-indexer";
import {
  minimalCellCapacityCompatible,
  addressToScript,
} from "@ckb-lumos/helpers";
import { common as commonScripts } from "@ckb-lumos/common-scripts";
import { mergeBuildingPacketFromSkeleton } from "@/lib/lumos-adapter/create-building-packet-from-skeleton";
import createSkeletonFromBuildingPacket from "@/lib/lumos-adapter/create-skeleton-from-building-packet";

function buildScript(scriptInfo, args) {
  return {
    codeHash: scriptInfo.CODE_HASH,
    hashType: scriptInfo.HASH_TYPE,
    args,
  };
}

function buildCellDep(scriptInfo) {
  return {
    outPoint: {
      txHash: scriptInfo.TX_HASH,
      index: scriptInfo.INDEX,
    },
    depType: scriptInfo.DEP_TYPE,
  };
}

export async function prepareVerifier(buildingPacket, fromAddress, config) {
  let txSkeleton = createSkeletonFromBuildingPacket(buildingPacket, config);

  const { ckbChainConfig, ckbRpcUrl } = config;
  const indexer = new Indexer(ckbRpcUrl);
  const verifierTypeScript = buildScript(
    ckbChainConfig.SCRIPTS.DAO_ACTION_VERIFIER,
    "0x",
  );
  const from = addressToScript(fromAddress, { config: ckbChainConfig });

  const verifierCollector = indexer.collector({
    lock: from,
    argsLen: (from.args.length - 2) / 2,
    type: verifierTypeScript,
    data: "0x",
  });
  const verifierCell = (await verifierCollector.collect().next()).value;
  if (verifierCell === null || verifierCell === undefined) {
    const newVerifierCell = {
      cellOutput: {
        capacity: "0x0",
        lock: from,
        type: verifierTypeScript,
      },
      data: "0x",
      outPoint: undefined,
      blockHash: undefined,
    };
    const minimalCapacity = minimalCellCapacityCompatible(newVerifierCell);
    newVerifierCell.cellOutput.capacity = minimalCapacity.toHexString();

    // create a new verifier cell
    txSkeleton = await commonScripts.injectCapacity(
      txSkeleton,
      [fromAddress],
      minimalCapacity,
      fromAddress,
      undefined,
      { config: ckbChainConfig },
    );
    txSkeleton = txSkeleton.update("outputs", (outputs) =>
      outputs.push(newVerifierCell),
    );
  } else {
    txSkeleton = await commonScripts.setupInputCell(
      txSkeleton,
      verifierCell,
      fromAddress,
      {
        config: ckbChainConfig,
      },
    );
  }

  // exchange change output and verifier cell
  const changeOutputIndex = buildingPacket.value.changeOutput;
  const outputsSize = txSkeleton.get("outputs").size;

  if (
    changeOutputIndex !== undefined &&
    changeOutputIndex !== null &&
    changeOutputIndex < outputsSize - 1
  ) {
    // exchange change cell and verifier cell to avoid multiple change cells
    txSkeleton = txSkeleton.update("outputs", (outputs) => {
      const verifierCell = outputs.get(outputsSize - 1);
      const changeCell = outputs.get(changeOutputIndex);
      return outputs
        .set(changeOutputIndex, verifierCell)
        .set(outputsSize - 1, changeCell);
    });
    txSkeleton = txSkeleton.update("fixedEntries", (fixedEntries) =>
      fixedEntries.push({ field: "outputs", index: outputsSize - 2 }),
    );
  } else {
    // no change output, fixed all outputs
    txSkeleton = txSkeleton.update("fixedEntries", (fixedEntries) =>
      fixedEntries.push({ field: "outputs", index: outputsSize - 1 }),
    );
  }

  txSkeleton = txSkeleton.update("cellDeps", (cellDeps) =>
    cellDeps.push(buildCellDep(ckbChainConfig.SCRIPTS.DAO_ACTION_VERIFIER)),
  );

  return mergeBuildingPacketFromSkeleton(buildingPacket, txSkeleton);
}
