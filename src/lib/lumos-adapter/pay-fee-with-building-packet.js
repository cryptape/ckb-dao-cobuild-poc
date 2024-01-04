import { common as commonScripts } from "@ckb-lumos/common-scripts";

import createBuildingPacketFromSkeleton from "./create-building-packet-from-skeleton";
import createSkeletonFromBuildingPacket from "./create-sckeleton-from-building-packet";

function outPointEqual(a, b) {
  return a.txHash === b.txHash && a.index === b.index;
}

// feePayments: [{address, fee?, feeRate?}]
export default async function payFeeWithBuildingPacket(
  buildingPacket,
  feePayments,
  { ckbRpcUrl, ckbChainConfig },
) {
  const rememberOutputsSize = buildingPacket.value.payload.outputs.length;
  let txSkeleton = createSkeletonFromBuildingPacket(buildingPacket, {
    ckbRpcUrl,
  });

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
