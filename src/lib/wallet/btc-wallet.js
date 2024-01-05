import { bech32 } from "bech32";
import * as bs58 from "bs58";
import * as lumosHelpers from "@ckb-lumos/helpers";
import { bytes } from "@ckb-lumos/codec";

import { urlSafeBase64Decode } from "@/lib/base64";

export function isNativeSegwit(btcAddress) {
  return btcAddress.startsWith("bc1q") || btcAddress.startsWith("tb1q");
}
export function isNestedSegwit(btcAddress) {
  return btcAddress.startsWith("3") || btcAddress.startsWith("2");
}
export function isLegacy(btcAddress) {
  return btcAddress.startsWith("1") || btcAddress.startsWith("n");
}

export function isSupported(btcAddress) {
  return (
    isNativeSegwit(btcAddress) ||
    isNestedSegwit(btcAddress) ||
    isLegacy(btcAddress)
  );
}

export function didConnected(btcAddresses) {
  const availableAccounts = btcAddresses.filter(isSupported);
  if (btcAddresses.length > 0 && availableAccounts.length === 0) {
    throw new Error(
      "Please choose an address type that is NOT Taproot (P2TR).",
    );
  }
  return availableAccounts;
}

export function btcAddressToCkbAddress(btcAddress, scriptInfo, ckbChainConfig) {
  let args = "0x04";
  if (isNativeSegwit(btcAddress)) {
    args += bytes
      .hexify(bech32.fromWords(bech32.decode(btcAddress).words.slice(1)))
      .slice(2);
  } else if (isNestedSegwit(btcAddress)) {
    args += bytes.hexify(bs58.decode(btcAddress).slice(1, 21)).slice(2);
  } else if (isLegacy(btcAddress)) {
    args += bytes.hexify(bs58.decode(btcAddress).slice(1, 21)).slice(2);
  } else {
    throw new Error(
      "Please choose an address type that is NOT Taproot (P2TR).",
    );
  }

  const script = {
    codeHash: scriptInfo.CODE_HASH,
    hashType: scriptInfo.HASH_TYPE,
    args: args,
  };
  return lumosHelpers.encodeToAddress(script, {
    config: ckbChainConfig,
  });
}

export function didSign(btcAddress, signature) {
  if (isNativeSegwit(btcAddress)) {
    signature[0] = 39 + ((signature[0] - 27) % 4);
  } else if (isNestedSegwit(btcAddress)) {
    signature[0] = 35 + ((signature[0] - 27) % 4);
  } else if (isLegacy(btcAddress)) {
    signature[0] = 31 + ((signature[0] - 27) % 4);
  } else {
    throw new Error(
      "Please choose an address type that is NOT Taproot (P2TR).",
    );
  }

  return bytes.hexify(signature);
}
