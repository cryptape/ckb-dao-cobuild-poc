import { BI } from "@ckb-lumos/bi";
import { DaoActionData } from "../schema";

test("pack/unpack", () => {
  const input = {
    type: "MultipleOperations",
    value: [
      {
        type: "Deposit",
        value: {
          lock: {
            codeHash: `0x01${"0".repeat(62)}`,
            hashType: "data",
            args: "0x02",
          },
          capacity: BI.from(300),
        },
      },
      {
        type: "ClaimTo",
        value: {
          previousOutput: {
            txHash: `0x04${"0".repeat(62)}`,
            index: 5,
          },
          totalClaimedCapacity: BI.from(600),
          to: undefined,
        },
      },
    ],
  };
  const unpacked = DaoActionData.unpack(DaoActionData.pack(input));

  expect(unpacked).toEqual(input);
});
