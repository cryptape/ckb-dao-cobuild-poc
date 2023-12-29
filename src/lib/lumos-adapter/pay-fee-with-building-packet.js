import { Indexer } from "@ckb-lumos/ckb-indexer";
import { createTransactionSkeleton } from "@ckb-lumos/helpers";
import { common as commonScripts } from "@ckb-lumos/common-scripts";

import createBuildingPacketFromSkeleton from "./create-building-packet-from-skeleton";

function outPointEqual(a, b) {
  return a.txHash === b.txHash && a.index === b.index;
}

// feePayments: [{address, fee?, feeRate?}]
export default async function payFeeWithBuildingPacket(
  buildingPacket,
  feePayments,
  { ckbRpcUrl, ckbChainConfig },
) {
  let txSkeleton = await createTransactionSkeleton(
    buildingPacket.value.payload,
    createCellFetcherFromBuildingPacket(buildingPacket),
  );
  // lock outputs except the change output
  const rememberOutputsSize = buildingPacket.value.payload.outputs.length;
  const lockedOutputs = Array.from(Array(rememberOutputsSize).keys())
    .filter((i) => i !== buildingPacket.value.changeOutput)
    .map((index) => ({ field: "outputs", index }));
  txSkeleton = txSkeleton.update("fixedEntries", (fixedEntries) =>
    fixedEntries.push(...lockedOutputs),
  );

  txSkeleton = txSkeleton.set("cellProvider", new Indexer(ckbRpcUrl));
  for (const { address, fee, feeRate } of feePayments) {
    if (fee !== null && fee !== undefined) {
      txSkeleton = await commonScripts.payFee(
        txSkeleton,
        [address],
        fee,
        undefined,
        {
          config: ckbChainConfig,
        },
      );
    }
    if (feeRate !== null && feeRate !== undefined) {
      txSkeleton = await commonScripts.payFeeByFeeRate(
        txSkeleton,
        [address],
        feeRate,
        undefined,
        { config: ckbChainConfig },
      );
    }
  }

  const newOutputsSize = txSkeleton.get("outputs").size;
  const changeOutput =
    buildingPacket.value.changeOutput ??
    (newOutputsSize > rememberOutputsSize ? newOutputsSize - 1 : null);

  const newBuildingPacket = createBuildingPacketFromSkeleton(
    txSkeleton,
    changeOutput,
  );
  return {
    type: buildingPacket.type,
    value: {
      ...buildingPacket.value,
      changeOutput,
      payload: newBuildingPacket.value.payload,
      resolvedInputs: newBuildingPacket.value.resolvedInputs,
    },
  };
}

export function createCellFetcherFromBuildingPacket(buildingPacket) {
  const resolvedInputs = buildingPacket.value.resolvedInputs;
  const tx = buildingPacket.value.payload;

  const fetcher = async (outPoint) => {
    const index = tx.inputs.findIndex((input) => {
      return outPointEqual(input.previousOutput, outPoint);
    });
    if (index === -1) {
      throw new Error(
        `Cannot find outponit ${outPoint.txHash} ${outPoint.index}`,
      );
    }
    return {
      outPoint,
      cellOutput: resolvedInputs.outputs[index],
      data: resolvedInputs.outputsData[index],
    };
  };

  return fetcher;
}
