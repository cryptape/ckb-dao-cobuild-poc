import { urlSafeBase64Decode } from "@/lib/base64";

import { didConnected, didSign, btcAddressToCkbAddress } from "./btc-wallet";

export const title = "OKX (BTC)";
export const lockScriptName = "Omnilock";

// Connects to the wallet.
export async function connect() {
  if (window.okxwallet !== null && window.okxwallet !== undefined) {
    const resp = await okxwallet.bitcoin.connect();
    const btcAddresses = [resp.address];
    return didConnected(btcAddresses);
  } else {
    throw new Error("Please install OKX Wallet first!");
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
    await okxwallet.bitcoin.signMessage(message.slice(2), { from: btcAddress }),
  );
  return didSign(btcAddress, signature);
}
