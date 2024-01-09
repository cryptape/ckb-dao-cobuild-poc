import { blockchain } from "@ckb-lumos/base";
import { createFixedBytesCodec, molecule } from "@ckb-lumos/codec";
const { table } = molecule;
const { BytesOpt } = blockchain;

const NullCodec = createFixedBytesCodec({
  pack: () => new Uint8Array(0),
  unpack: () => null,
  byteLength: 0,
});

export const OmnilockWitnessLock = table(
  {
    signature: BytesOpt,

    // Fields not used in PoC
    omniIdentity: NullCodec,
    preimage: NullCodec,
  },
  ["signature", "omniIdentity", "preimage"],
);

export function packOmnilockWitnessLock(signature) {
  return OmnilockWitnessLock.pack({
    signature,
    omniIdentity: null,
    preimage: null,
  });
}
