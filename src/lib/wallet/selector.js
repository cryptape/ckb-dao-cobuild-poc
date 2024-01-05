import * as joyid from "./joyid";
import * as unisat from "./unisat";

export const providers = { joyid, unisat };

export function walletName(slug) {
  return providers[slug].title;
}

export async function connect(slug) {
  return await providers[slug].connect();
}

// Wallet connection to address
export function address(slug, connection, ckbChainConfig) {
  return providers[slug].address(connection, ckbChainConfig);
}

export async function sign(slug, connection, message, ckbChainConfig) {
  return await providers[slug].connect(connection, message, ckbChainConfig);
}
