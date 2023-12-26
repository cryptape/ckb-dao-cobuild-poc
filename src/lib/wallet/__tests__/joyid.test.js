import { bytes } from "@ckb-lumos/codec";
import { signatureFromDer } from "../joyid";

test("signatureFromDer", () => {
  const expected = bytes.bytify(
    "0xa7c6fd8ee18669228e57013528909037b7ceeca29bd7d04c1632ccb5dd9d6ba2487047b723183f8fef8798b83e87f908a68bed18860067c68f08811f2474fef8",
  );
  const actual = signatureFromDer(
    "MEUCIQCnxv2O4YZpIo5XATUokJA3t87sopvX0EwWMsy13Z1rogIgSHBHtyMYP4_vh5i4Pof5CKaL7RiGAGfGjwiBHyR0_vg",
  );
  expect(actual).toEqual(expected);
});
