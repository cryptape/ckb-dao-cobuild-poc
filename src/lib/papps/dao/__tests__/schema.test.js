import { BI } from "@ckb-lumos/bi";
import { DaoActionData } from "../schema";

test("pack/unpack", () => {
  const input = {
    deposits: [
      {
        from: {
          codeHash: `0x01${"0".repeat(62)}`,
          hashType: "data",
          args: "0x02",
        },
        to: {
          codeHash: `0x03${"0".repeat(62)}`,
          hashType: "data",
          args: "0x04",
        },
        amount: {
          shannons: BI.from(500),
        },
      },
    ],
    claims: [
      {
        cellPointer: {
          txHash: `0x06${"0".repeat(62)}`,
          index: 7,
        },
        from: {
          codeHash: `0x08${"0".repeat(62)}`,
          hashType: "data",
          args: "0x09",
        },
        to: {
          codeHash: `0x0a${"0".repeat(62)}`,
          hashType: "data",
          args: "0x0b",
        },
        depositInfo: {
          depositBlockNumber: BI.from("0x0c"),
          depositTimestamp: {
            unixMilliseconds: BI.from("0x0d"),
          },
          amount: {
            shannons: BI.from("0x0e"),
          },
        },
        withdrawInfo: {
          withdrawBlockNumber: BI.from("0x0f"),
          withdrawTimestamp: {
            unixMilliseconds: BI.from("0x10"),
          },
          componsationAmount: {
            shannons: BI.from("0x11"),
          },
        },
      },
    ],
    withdraws: [],
  };
  const unpacked = DaoActionData.unpack(DaoActionData.pack(input));

  expect(unpacked).toEqual(input);
});
