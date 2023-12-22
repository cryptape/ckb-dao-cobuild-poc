import { tryParseWitness, blockchain, WitnessLayout } from "../types";

test("tryParseWitness(empty)", () => {
  expect(() => tryParseWitness(null)).toThrow("Unknown witness format");
  expect(() => tryParseWitness(undefined)).toThrow("Unknown witness format");
  expect(() => tryParseWitness("0x")).toThrow("Unknown witness format");
});

test("tryParseWitness(WitnessArgs)", () => {
  const unpacked = {
    lock: "0x",
  };
  const input = blockchain.WitnessArgs.pack(unpacked);
  const { type, value } = tryParseWitness(input);
  expect(type).toBe("WitnessArgs");
  expect(value).toEqual(unpacked);
});

test("tryParseWitness(WitnessLayout)", () => {
  const unpacked = {
    type: "SighashAllOnly",
    value: {
      seal: "0x",
    },
  };
  const input = WitnessLayout.pack(unpacked);
  const { type, value } = tryParseWitness(input);
  expect(type).toBe("WitnessLayout");
  expect(value).toEqual(unpacked);
});

test("tryParseWitness(Bytes)", () => {
  const input = blockchain.Bytes.pack("0x00");
  expect(() => tryParseWitness(input)).toThrow("Unknown witness format");
});
