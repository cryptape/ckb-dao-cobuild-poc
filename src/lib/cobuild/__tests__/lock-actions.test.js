import { getTestnetConfig } from "../../config";
import { prepareLockActions } from "../lock-actions";
import { GeneralLockAction, chooseWitnessStore } from "../general-lock-actions";

const { ckbChainConfig } = getTestnetConfig();

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
      "0xe801000010000000dc010000e8010000c8010000013538dfd53ad93d2e0a6e7f470295dcd71057d825e1f87229e5afe2a906aa7cfc099fdfa04442dac33548b6988af8af58d2052529088f7b73ef00800f7fbcddb3fc4d858bec973befa4649f52df30ae6df10e96bc0ee46ad9fb879b6a6800ca3eb9c3fb1e4424d0bca229592ec5529ea8c3b6c36e60c4c973391dc159dea157142b8b05e1f0303efb898fe4d6de601198c7a7b864abbe6a21c73b2e787e187c5205000000007b2274797065223a22776562617574686e2e676574222c226368616c6c656e6765223a225a6a45334e6a55304f574a6b4e3245775a6a566a4f474978597a55774f5452694f57557a4e546c6d596a453259546c6c596a63334d544532597a49354e444d344f4749334d475132595468694e6a6b345a474e6a4e77222c226f726967696e223a2268747470733a2f2f746573746e65742e6a6f7969642e646576222c2263726f73734f726967696e223a66616c73652c226f746865725f6b6579735f63616e5f62655f61646465645f68657265223a22646f206e6f7420636f6d7061726520636c69656e74446174614a534f4e20616761696e737420612074656d706c6174652e205365652068747470733a2f2f676f6f2e676c2f796162506578227d080000000100000000000000",
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
    "0x6ea7155a88702a920203821996a13b24c0a2c4f1e0a94e141ca46202324ab0eb",
  );
});
