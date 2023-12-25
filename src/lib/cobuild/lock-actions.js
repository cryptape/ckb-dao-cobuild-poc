import { utils as ckbBaseUtils } from "@ckb-lumos/base";

import * as generalLockActions from "./general-lock-actions";
import { parseWitnessType } from "./types";

const { computeScriptHash } = ckbBaseUtils;

// Generate lockActions.
//
// Do not set any witness in payload to use the Cobuild layout.
export function prepareLockActions(buildingPacket, ckbChainConfig) {
  const groups = groupByLock(buildingPacket.value.resolvedInputs.outputs);
  return Object.entries(groups).reduce(
    (acc, [scriptHash, inputs]) =>
      dispatchLockActions(
        acc,
        scriptHash,
        inputs.map((e) => e[0]),
        ckbChainConfig,
      ),
    buildingPacket,
  );
}

export function storeWitness(buildingPacket, witnessStore, seal) {
  const witnesses = buildingPacket.value.payload.witnesses;
  const inputIndices = witnessStore.value.inputIndices;

  if (witnessStore.type === "CobuildSighashAllStore") {
    witnesses[inputIndices[0]] = WitnessLayout.pack({
      type: "SighashAll",
      value: {
        message: buildingPacket.message,
        seal,
      },
    });
  } else if (witnessStore.type === "CobuildSighashAllOnlyStore") {
    witnesses[inputIndices[0]] = WitnessLayout.pack({
      type: "SighashAllOnly",
      value: {
        seal,
      },
    });
  } else if (witnessStore.type === "WitnessArgsStore") {
    const firstWitnessHex = witnesses[inputIndices[0]];
    const firstWitnessArgs =
      firstWitnessHex !== null &&
      firstWitnessHex !== undefined &&
      firstWitnessHex !== "0x"
        ? WitnessArgs.unpack(firstWitnessHex)
        : {};
    firstWitnessArgs.lock = seal;
    witnesses[inputIndices[0]] = WitnessArgs.pack(firstWitnessArgs);
    // fill empty witnesses
    for (const i of inputIndices.slice(1)) {
      witnesses[i] = witnesses[i] ?? "0x";
    }
  }

  return buildingPacket;
}

export function finalizeWitness(buildingPacket) {
  // fill holes
  const witnesses = Array.from(
    buildingPacket.value.payload.witnesses.values().map((w) => w ?? "0x"),
  );

  // If there's no SighashAll before SighashAllOnly, replace the first SighashAllOnly with SighashAll
  for (const i of witnesses.keys()) {
    const witnessType = parseWitnessType(witnesses[i]);
    if (witnessType === "SighashAll") {
      break;
    } else if (witnessType === "SighashAllOnly") {
      const witness = WitnessLayout.unpack(witnesses[i]);
      witnesses[i] = WitnessLayout.pack({
        type: "SighashAll",
        value: {
          seal: witness.value.seal,
          message: buildingPacket.value.message,
        },
      });
    }
  }

  buildingPacket.value.payload.witnesses = witnesses;
}

function groupByLock(cellOutputs) {
  return Object.groupBy(cellOutputs.entries(), ([_i, v]) =>
    computeScriptHash(v.lock),
  );
}

function dispatchLockActions(
  buildingPacket,
  scriptHash,
  inputIndices,
  ckbChainConfig,
) {
  const script =
    buildingPacket.value.resolvedInputs.outputs[inputIndices[0]].lock;
  if (script.codeHash === ckbChainConfig.SCRIPTS.JOYID_COBUILD_POC.CODE_HASH) {
    return generalLockActions.prepareLockAction(
      buildingPacket,
      scriptHash,
      inputIndices,
      // reset WitnessArgs.lock to null
      () => null,
    );
  }

  throw new Error(
    `NotSupportedLock: codeHash=${script.codeHash} hashType=${script.hashType}`,
  );
}
