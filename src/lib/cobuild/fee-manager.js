import { bytes } from "@ckb-lumos/codec";

import payFeeWithBuildingPacket from "../lumos-adapter/pay-fee-with-building-packet";
import * as generalLockActions from "./general-lock-actions";
import { finalizeWitnesses } from "./lock-actions";
import { groupByLock } from "./script-group";

// feePayments: [{address, fee?, feeRate?}]
export async function payFee(buildingPacket, feePayments, config) {
  const groups = groupByLock(buildingPacket.value.resolvedInputs.outputs);

  // Rember fields that should be restored
  const witnesses = buildingPacket.value.payload.witnesses;

  const buildingPacketWillPayFee = finalizeWitnesses(
    Object.entries(groups).reduce(
      (acc, [scriptHash, inputs]) =>
        storeWitnessForFeeEstimation(
          acc,
          scriptHash,
          inputs.map((e) => e[0]),
          config.ckbChainConfig,
        ),
      buildingPacket,
    ),
  );

  const buildingPacketHavePaidFee = await payFeeWithBuildingPacket(
    buildingPacketWillPayFee,
    feePayments,
    config,
  );

  return {
    type: buildingPacketHavePaidFee.type,
    value: {
      ...buildingPacketHavePaidFee.value,
      payload: {
        ...buildingPacketHavePaidFee.value.payload,
        witnesses,
      },
    },
  };
}

function storeWitnessForFeeEstimation(
  buildingPacket,
  scriptHash,
  inputIndices,
  ckbChainConfig,
) {
  const script =
    buildingPacket.value.resolvedInputs.outputs[inputIndices[0]].lock;
  if (script.codeHash === ckbChainConfig.SCRIPTS.JOYID.CODE_HASH) {
    return generalLockActions.storeWitnessForFeeEstimation(
      buildingPacket,
      scriptHash,
      inputIndices,
      // Variable length, but 500 is usually enough.
      () => bytes.hexify(new Uint8Array(500)),
    );
  }

  throw new Error(
    `NotSupportedLock: codeHash=${script.codeHash} hashType=${script.hashType}`,
  );
}
