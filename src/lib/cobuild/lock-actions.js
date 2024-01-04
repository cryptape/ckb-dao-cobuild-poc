import { utils as lumosBaseUtils } from "@ckb-lumos/base";

import * as generalLockActions from "./general-lock-actions";
import { parseWitnessType } from "./types";
import { groupByLock } from "./script-group";

const { computeScriptHash } = lumosBaseUtils;

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

export function finalizeWitnesses(buildingPacket) {
  // fill holes
  const witnesses = Array.from(buildingPacket.value.payload.witnesses).map(
    (w) => w ?? "0x",
  );
  // If there's no SighashAll before SighashAllOnly, replace the first SighashAllOnly with SighashAll
  for (const i of witnesses.keys()) {
    if (witnesses[i] === "0x") {
      continue;
    }
    const witnessType = parseWitnessType(witnesses[i]);
    if (witnessType === "SighashAll") {
      break;
    } else if (witnessType === "SighashAllOnly") {
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
      // reset WitnessArgs.lock to null
      () => `0x${"0".repeat(129 * 2)}`,
    );
  }

  throw new Error(
    `NotSupportedLock: codeHash=${script.codeHash} hashType=${script.hashType}`,
  );
}
