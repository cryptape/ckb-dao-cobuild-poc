import { blockchain, utils as lumosBaseUtils } from "@ckb-lumos/base";
import { bytes, number, molecule } from "@ckb-lumos/codec";

import { ScriptInfo, Message, WitnessLayout } from "./types";

const { union, table, vector } = molecule;
const { Uint32 } = number;
const { ckbHash, CKBHasher } = lumosBaseUtils;

export function prepareLockAction(
  buildingPacket,
  scriptHash,
  inputIndices,
  createWitnessArgsPlaceholder,
) {
  const witnessStore = chooseWitnessStore(buildingPacket, inputIndices);
  return prepareLockActionWithWitnessStore(
    buildingPacket,
    scriptHash,
    witnessStore,
    createWitnessArgsPlaceholder,
  );
}

export function prepareLockActionWithWitnessStore(
  buildingPacket,
  scriptHash,
  witnessStore,
  createWitnessArgsPlaceholder,
) {
  const scriptInfo = { ...GeneralLockScriptInfo, scriptHash };
  const scriptInfoHash = ckbHash(ScriptInfo.pack(scriptInfo));
  const inputIndices = witnessStore.value.inputIndices;
  const digest = createDigest(
    buildingPacket,
    inputIndices,
    createWitnessArgsPlaceholder,
    witnessStore,
  );
  const data = bytes.hexify(
    GeneralLockAction.pack({
      digest,
      witnessStore,
    }),
  );
  const action = {
    scriptInfoHash,
    scriptHash,
    data,
  };

  const lockActions = buildingPacket.value.lockActions.filter(
    (a) => a.scriptHash !== action,
  );
  lockActions.push(action);

  return {
    type: buildingPacket.type,
    value: {
      ...buildingPacket.value,
      lockActions,
    },
  };
}

export function storeWitnessForFeeEstimation(
  buildingPacket,
  scriptHash,
  witnessStore,
  createSealPlaceHolder,
) {
  buildingPacket = prepareLockActionWithWitnessStore(
    buildingPacket,
    scriptHash,
    witnessStore,
    createSealPlaceHolder,
  );
  const lockAction = buildingPacket.value.lockActions.find(
    (action) => action.scriptHash === scriptHash,
  );
  return applyLockAction(buildingPacket, lockAction, createSealPlaceHolder());
}

export function applyLockAction(buildingPacket, lockAction, seal) {
  const witnesses = [...buildingPacket.value.payload.witnesses];
  const { witnessStore } = GeneralLockAction.unpack(lockAction.data);
  const inputIndices = witnessStore.value.inputIndices;

  if (witnessStore.type === "CobuildSighashAllStore") {
    witnesses[inputIndices[0]] = bytes.hexify(
      WitnessLayout.pack({
        type: "SighashAll",
        value: {
          message: buildingPacket.value.message,
          seal,
        },
      }),
    );
  } else if (witnessStore.type === "CobuildSighashAllOnlyStore") {
    witnesses[inputIndices[0]] = bytes.hexify(
      WitnessLayout.pack({
        type: "SighashAllOnly",
        value: {
          seal,
        },
      }),
    );
  } else if (witnessStore.type === "WitnessArgsStore") {
    const firstWitnessHex = witnesses[inputIndices[0]];
    const firstWitnessArgs =
      firstWitnessHex !== null &&
      firstWitnessHex !== undefined &&
      firstWitnessHex !== "0x"
        ? blockchain.WitnessArgs.unpack(firstWitnessHex)
        : {};
    firstWitnessArgs.lock = seal;
    witnesses[inputIndices[0]] = bytes.hexify(
      blockchain.WitnessArgs.pack(firstWitnessArgs),
    );
    // fill empty witnesses
    for (const i of inputIndices.slice(1)) {
      witnesses[i] = witnesses[i] ?? "0x";
    }
  }

  const lockActions = buildingPacket.value.lockActions.filter(
    (action) => action.scriptHash !== lockAction.scriptHash,
  );

  return {
    type: buildingPacket.type,
    value: {
      ...buildingPacket.value,
      payload: {
        ...buildingPacket.value.payload,
        witnesses,
      },
      lockActions,
    },
  };
}

export function chooseWitnessStore(buildingPacket, inputIndices) {
  // Use CoBuild when all witnesses are empty
  for (const i of inputIndices) {
    const witness = buildingPacket.value.payload.witnesses[i];
    if (witness !== null && witness !== undefined && witness !== "0x") {
      return {
        type: "WitnessArgsStore",
        value: { inputIndices },
      };
    }
  }

  return {
    type:
      inputIndices[0] === 0
        ? "CobuildSighashAllStore"
        : "CobuildSighashAllOnlyStore",
    value: { inputIndices },
  };
}

export function createDigest(
  buildingPacket,
  inputIndices,
  createWitnessArgsPlaceholder,
  witnessStore,
) {
  if (witnessStore.type !== "WitnessArgsStore") {
    return createCobuildDigest(buildingPacket);
  } else {
    return createWitnessArgsDigest(
      buildingPacket,
      inputIndices,
      createWitnessArgsPlaceholder,
    );
  }
}

function computeTxHash(tx) {
  return ckbHash(blockchain.RawTransaction.pack(tx));
}

export function createCobuildDigest(buildingPacket) {
  const tx = buildingPacket.value.payload;
  const txHash = computeTxHash(tx);

  const skeletonHasher = new CKBHasher();
  skeletonHasher.update(bytes.bytify(txHash));
  for (const witness of tx.witnesses.slice(tx.inputs.length)) {
    const witnessBytes = bytes.bytify(witness);
    skeletonHasher.update(
      bytes.bytify(number.Uint64LE.pack(witnessBytes.length)),
    );
    skeletonHasher.update(witnessBytes);
  }
  const skeletonHash = bytes.bytify(skeletonHasher.digestHex());

  const message = bytes.bytify(Message.pack(buildingPacket.value.message));

  const hasher = new CKBHasher();
  hasher.update(skeletonHash);
  hasher.update(bytes.bytify(number.Uint64LE.pack(message.length)));
  hasher.update(message);
  return hasher.digestHex();
}

export function createWitnessArgsDigest(
  buildingPacket,
  inputIndices,
  createWitnessArgsPlaceholder,
) {
  const tx = buildingPacket.value.payload;
  const txHash = computeTxHash(tx);

  const hasher = new CKBHasher();

  hasher.update(bytes.bytify(txHash));

  const firstWitness = tx.witnesses[inputIndices[0]] ?? "0x";
  const firstWitnessArgs =
    firstWitness !== null && firstWitness !== undefined && firstWitness !== "0x"
      ? blockchain.WitnessArgs.unpack(firstWitness)
      : {};
  firstWitnessArgs.lock = createWitnessArgsPlaceholder(
    buildingPacket,
    inputIndices,
  );
  const firstWitnessBytes = bytes.bytify(
    blockchain.WitnessArgs.pack(firstWitnessArgs),
  );
  hasher.update(bytes.bytify(number.Uint64LE.pack(firstWitnessBytes.length)));
  hasher.update(firstWitnessBytes);

  for (const i of inputIndices.slice(1)) {
    const witnessBytes = bytes.bytify(tx.witnesses[i] ?? "0x");
    hasher.update(bytes.bytify(number.Uint64LE.pack(witnessBytes.length)));
    hasher.update(witnessBytes);
  }

  for (const witness of tx.witnesses.slice(tx.inputs.length)) {
    const witnessBytes = bytes.bytify(witness);
    hasher.update(bytes.bytify(number.Uint64LE.pack(witnessBytes.length)));
    hasher.update(witnessBytes);
  }

  return hasher.digestHex();
}

export const GENERAL_LOCK_SCHEMA = `
array Uint32 [byte; 4];
array Byte32 [byte; 32];
vecotr Uint32Vec <Uint32>;

table WitnessArgsStore {
    input_indices: Uint32Vec,
}
table CobuildSighashAllStore {
    input_indices: Uint32Vec,
}
table CobuildSighashAllOnlyStore {
    input_indices: Uint32Vec,
}

enum WitnessStore {
    WitnessArgsStore,
    CobuildSighashAllStore,
    CobuildSighashAllOnlyStore,
}

table GeneralLockAction {
    digest: Byte32,
    witness_store: WitnessStore,
}
`;

export const Uint32Vec = vector(Uint32);

export const WitnessArgsStore = table(
  {
    inputIndices: Uint32Vec,
  },
  ["inputIndices"],
);
export const CobuildSighashAllStore = table(
  {
    inputIndices: Uint32Vec,
  },
  ["inputIndices"],
);
export const CobuildSighashAllOnlyStore = table(
  {
    inputIndices: Uint32Vec,
  },
  ["inputIndices"],
);

export const WitnessStore = union(
  { WitnessArgsStore, CobuildSighashAllStore, CobuildSighashAllOnlyStore },
  ["WitnessArgsStore", "CobuildSighashAllStore", "CobuildSighashAllOnlyStore"],
);

export const GeneralLockAction = table(
  {
    digest: blockchain.Byte32,
    witnessStore: WitnessStore,
  },
  ["digest", "witnessStore"],
);

export const GeneralLockScriptInfo = {
  name: bytes.bytifyRawString("GeneralLock"),
  url: bytes.bytifyRawString("https://github.com/crytpape/ckb-dao-cobuild-poc"),
  scriptHash: null,
  schema: bytes.bytifyRawString(GENERAL_LOCK_SCHEMA),
  messageType: bytes.bytifyRawString("GeneralLockAction"),
};
