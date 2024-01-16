import { urlSafeBase64Decode } from "@/lib/base64";

import {
  prepareMessage,
  didConnected,
  didSign,
  btcAddressToCkbAddress,
} from "./btc-wallet";

export const title = "UniSat (BTC)";
export const lockScriptName = "Omnilock";

// Connects to the wallet.
export async function connect() {
  if (window.unisat !== null && window.unisat !== undefined) {
    const btcAddresses = await unisat.requestAccounts();
    return didConnected(btcAddresses);
  } else {
    throw new Error("Please install UniSat first!");
  }
}

// Gets the CKB address.
//
// Calls this function only when wallet is connected.
export function address(btcAddress, ckbChainConfig) {
  const scriptInfo = ckbChainConfig.SCRIPTS.OMNILOCK_CUSTOM;
  return btcAddressToCkbAddress(btcAddress, scriptInfo, ckbChainConfig);
}

export async function sign(btcAddress, message) {
  const signature = urlSafeBase64Decode(
    await unisat.signMessage(prepareMessage(message)),
  );
  return didSign(btcAddress, signature);
}
