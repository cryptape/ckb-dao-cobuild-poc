import { bech32 } from "bech32";
import * as bs58 from "bs58";
import * as lumosHelpers from "@ckb-lumos/helpers";
import { bytes } from "@ckb-lumos/codec";

export const title = "UniSat";

function isSupported(btcAddress) {
  return (
    btcAddress.startsWith("bc1q") ||
    btcAddress.startsWith("3") ||
    btcAddress.startsWith("1") ||
    btcAddress.startsWith("tb1q") ||
    btcAddress.startsWith("2") ||
    btcAddress.startsWith("n")
  );
}

// Connects to the wallet.
export async function connect() {
  if (window.unisat !== null && window.unisat !== undefined) {
    const accounts = await unisat.requestAccounts();
    const availableAccounts = accounts.filter(isSupported);
    if (accounts.length > 0 && availableAccounts.length === 0) {
      throw new Error(
        "Please connect LIVENET and choose an address type that is NOT Taproot (P2TR).",
      );
    }
    return availableAccounts;
  } else {
    throw new Error("Please install UniSat first!");
  }
}

// Gets the CKB address.
//
// Calls this function only when wallet is connected.
export function address(btcAddress, ckbChainConfig) {
  let args = "0x04";
  if (btcAddress.startsWith("bc1q") || btcAddress.startsWith("tb1q")) {
    // NativeSegwit
    args += bytes
      .hexify(bech32.fromWords(bech32.decode(btcAddress).words.slice(1)))
      .slice(2);
  } else if (btcAddress.startsWith("3") || btcAddress.startsWith("2")) {
    // NestedSegwit
    args += bytes.hexify(bs58.decode(btcAddress).slice(1, 21)).slice(2);
  } else if (btcAddress.startsWith("1") || btcAddress.startsWith("n")) {
    // Legacy
    args += bytes.hexify(bs58.decode(btcAddress).slice(1, 21)).slice(2);
  } else {
    throw new Error(
      "Please connect LIVENET and choose an address type that is NOT Taproot (P2TR).",
    );
  }

  const scriptInfo = ckbChainConfig.SCRIPTS.UNISAT;
  const script = {
    codeHash: scriptInfo.CODE_HASH,
    hashType: scriptInfo.HASH_TYPE,
    args: args,
  };
  return lumosHelpers.encodeToAddress(script, {
    config: ckbChainConfig,
  });
}
