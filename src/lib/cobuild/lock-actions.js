import { utils as lumosBaseUtils } from "@ckb-lumos/base";
import { bytes } from "@ckb-lumos/codec";

import * as generalLockActions from "./general-lock-actions";
import { groupByLock } from "./script-group";
import { parseWitnessType, WitnessLayout } from "./types";

const { computeScriptHash } = lumosBaseUtils;

// Generate lockActions.
//
// Do not set any witness in payload to use the Cobuild layout.
export function prepareLockActions(buildingPacket, ckbChainConfig) {
  // Workaround to pack Cobuild message as the extra witness.
  //
  // Before the next action, there's no actual witness set yet. So `finalizeWitnesses` will assume there's no SighashAll witness in the tx and will pack the message as the extra witness. This assumption is currect because this PoC uses WitnessArgs layout for lock actions and DAO type script.
  buildingPacket = finalizeWitnesses(buildingPacket, ckbChainConfig);

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

function hasVerifierCell(buildingPacket, ckbChainConfig) {
  const template = ckbChainConfig.SCRIPTS.DAO_ACTION_VERIFIER;
  for (const output of buildingPacket.value.payload.outputs) {
    if (
      output.type !== undefined &&
      output.type !== null &&
      output.type.codeHash === template.CODE_HASH
    ) {
      return true;
    }
  }

  return false;
}

export function finalizeWitnesses(buildingPacket, ckbChainConfig) {
  // fill holes
  const witnesses = Array.from(buildingPacket.value.payload.witnesses).map(
    (w) => w ?? "0x",
  );

  let hasSighashAll = false;
  // If there's no SighashAll before SighashAllOnly, replace the first SighashAllOnly with SighashAll
  for (const i of witnesses.keys()) {
    if (witnesses[i] === "0x") {
      continue;
    }
    const witnessType = parseWitnessType(witnesses[i]);
    if (witnessType === "SighashAll") {
      hasSighashAll = true;
      break;
    } else if (witnessType === "SighashAllOnly") {
      hasSighashAll = true;
      const witness = WitnessLayout.unpack(witnesses[i]);
      witnesses[i] = bytes.hexify(
        WitnessLayout.pack({
          type: "SighashAll",
          value: {
            seal: witness.value.seal,
            message: buildingPacket.value.message,
          },
        }),
      );
    }
  }

  // if there's a verifier cell, pack the Cobuild message into witness
  if (!hasSighashAll && hasVerifierCell(buildingPacket, ckbChainConfig)) {
    for (
      let i = witnesses.length;
      i < buildingPacket.value.payload.inputs.length;
      ++i
    ) {
      witnesses[i] = "0x";
    }
    witnesses[buildingPacket.value.payload.inputs.length] = bytes.hexify(
      WitnessLayout.pack({
        type: "SighashAll",
        value: {
          seal: "0x",
          message: buildingPacket.value.message,
        },
      }),
    );
  }

  return {
    type: buildingPacket.type,
    value: {
      ...buildingPacket.value,
      payload: {
        ...buildingPacket.value.payload,
        witnesses,
      },
    },
  };
}

export function findLockActionByLockScript(buildingPacket, lockScript) {
  const scriptHash = computeScriptHash(lockScript);
  return buildingPacket.value.lockActions.find(
    (action) => action.scriptHash === scriptHash,
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
  if (script.codeHash === ckbChainConfig.SCRIPTS.JOYID.CODE_HASH) {
    return generalLockActions.prepareLockActionWithWitnessStore(
      buildingPacket,
      scriptHash,
      {
        type: "WitnessArgsStore",
        value: {
          inputIndices,
        },
      },
      () => `0x${"0".repeat(129 * 2)}`,
    );
  } else if (
    script.codeHash === ckbChainConfig.SCRIPTS.OMNILOCK_CUSTOM.CODE_HASH
  ) {
    return generalLockActions.prepareLockActionWithWitnessStore(
      buildingPacket,
      scriptHash,
      {
        type: "WitnessArgsStore",
        value: {
          inputIndices,
        },
      },
      // 85 = 65 signature in OmnilockWitnessLock
      () => `0x${"0".repeat(85 * 2)}`,
    );
  }

  throw new Error(
    `NotSupportedLock: codeHash=${script.codeHash} hashType=${script.hashType}`,
  );
}
