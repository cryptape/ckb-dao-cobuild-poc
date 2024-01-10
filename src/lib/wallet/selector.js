import * as joyid from "./joyid";
import * as unisat from "./unisat";
import * as okx from "./okx";

export const providers = { joyid, unisat, okx };

export function walletName(slug) {
  return providers[slug].title;
}

export function lockScriptName(slug) {
  return providers[slug].lockScriptName;
}

export async function connect(slug) {
  return await providers[slug].connect();
}

// Wallet connection to address
export function address(slug, connection, ckbChainConfig) {
  return providers[slug].address(connection, ckbChainConfig);
}

export async function sign(slug, connection, message, ckbChainConfig) {
  return await providers[slug].sign(connection, message, ckbChainConfig);
}
