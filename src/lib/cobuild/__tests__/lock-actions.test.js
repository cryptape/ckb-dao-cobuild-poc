import { useTestnetConfig } from "../../config";
import { prepareLockActions } from "../lock-actions";
import { GeneralLockAction, chooseWitnessStore } from "../general-lock-actions";

const { ckbChainConfig } = useTestnetConfig();

test("cobuild layout", () => {
  const tx = {
    version: "0x0",
    cellDeps: [
      {
        outPoint: {
          txHash:
            "0x0101010101010101010101010101010101010101010101010101010101010101",
          index: "0x1",
        },
        depType: "code",
      },
    ],
    headerDeps: [],
    inputs: [
      {
        since: "0x0",
        previousOutput: {
          txHash:
            "0x0101010101010101010101010101010101010101010101010101010101010101",
          index: "0x2",
        },
      },
    ],
    outputs: [
      {
        capacity: "0x174876e800",
        lock: {
          codeHash:
            "0x77c93b0632b5b6c3ef922c5b7cea208fb0a7c427a13d50e13d3fefad17e0c590",
          hashType: "type",
          args: "0xac4fb598d2e089e62406707d1aee4a27219515cc",
        },
        type: null,
      },
    ],
    outputsData: ["0x"],
    witnesses: ["0x"],
  };
  const inputBuildingPacket = {
    type: "BuildingPacketV1",
    value: {
      message: {
        actions: [],
      },
      payload: tx,
      resolvedInputs: {
        outputs: [
          {
            capacity: "0x174876e800",
            lock: {
              codeHash:
                "0xd23761b364210735c19c60561d213fb3beae2fd6172743719eff6920e020baac",
              hashType: "type",
              args: "0xac4fb598d2e089e62406707d1aee4a27219515cc",
            },
            type: null,
          },
        ],
      },
      lockActions: [],
    },
  };

  expect(chooseWitnessStore(inputBuildingPacket, [0]).type).toEqual(
    "CobuildSighashAllStore",
  );

  const outputBuildingPacket = prepareLockActions(
    inputBuildingPacket,
    ckbChainConfig,
  );
  const lockAction = GeneralLockAction.unpack(
    outputBuildingPacket.value.lockActions[0].data,
  );
  expect(lockAction.digest).toBe(
    "0xb878fcba4398b284a80c0d752154e7920b0aefc6296b31af23dff069d18f3760",
  );
});

test("witness args layout", () => {
  const tx = {
    version: "0x0",
    cellDeps: [
      {
        outPoint: {
          txHash:
            "0x0101010101010101010101010101010101010101010101010101010101010101",
          index: "0x1",
        },
        depType: "code",
      },
    ],
    headerDeps: [],
    inputs: [
      {
        since: "0x0",
        previousOutput: {
          txHash:
            "0x0101010101010101010101010101010101010101010101010101010101010101",
          index: "0x2",
        },
      },
    ],
    outputs: [
      {
        capacity: "0x174876e800",
        lock: {
          codeHash:
            "0x77c93b0632b5b6c3ef922c5b7cea208fb0a7c427a13d50e13d3fefad17e0c590",
          hashType: "type",
          args: "0xac4fb598d2e089e62406707d1aee4a27219515cc",
        },
        type: null,
      },
    ],
    outputsData: ["0x"],
    witnesses: [
      "0x6e010000100000006e0100006e0100005a0100003538dfd53ad93d2e0a6e7f470295dcd71057d825e1f87229e5afe2a906aa7cfc099fdfa04442dac33548b6988af8af58d2052529088f7b73ef00800f7fbcddb3a7c6fd8ee18669228e57013528909037b7ceeca29bd7d04c1632ccb5dd9d6ba2487047b723183f8fef8798b83e87f908a68bed18860067c68f08811f2474fef82b8b05e1f0303efb898fe4d6de601198c7a7b864abbe6a21c73b2e787e187c5205000000007b2274797065223a22776562617574686e2e676574222c226368616c6c656e6765223a225a5749354e7a41334d5749324e475531593255775a574a6b4d3259304e6d55324d7a63324e446b794d47466c4e575933596a49774f544e6a4f54417a4d44466b4e6d4a6b5a475a685a6a5a6c5a6a55775a546b785a51222c226f726967696e223a2268747470733a2f2f746573746e65742e6a6f7969642e646576222c2263726f73734f726967696e223a66616c73657d",
    ],
  };
  const inputBuildingPacket = {
    type: "BuildingPacketV1",
    value: {
      message: {
        actions: [],
      },
      payload: tx,
      resolvedInputs: {
        outputs: [
          {
            capacity: "0x174876e800",
            lock: {
              codeHash:
                "0xd23761b364210735c19c60561d213fb3beae2fd6172743719eff6920e020baac",
              hashType: "type",
              args: "0xac4fb598d2e089e62406707d1aee4a27219515cc",
            },
            type: null,
          },
        ],
      },
      lockActions: [],
    },
  };

  expect(chooseWitnessStore(inputBuildingPacket, [0]).type).toEqual(
    "WitnessArgsStore",
  );

  const outputBuildingPacket = prepareLockActions(
    inputBuildingPacket,
    ckbChainConfig,
  );
  const lockAction = GeneralLockAction.unpack(
    outputBuildingPacket.value.lockActions[0].data,
  );
  expect(lockAction.digest).toBe(
    "0xb878fcba4398b284a80c0d752154e7920b0aefc6296b31af23dff069d18f3760",
  );
});
