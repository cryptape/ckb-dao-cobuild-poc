import * as joyid from "@joyid/ckb";
import { bytes } from "@ckb-lumos/codec";
import * as lumosHelpers from "@ckb-lumos/helpers";
import base64 from "base64-js";

export const title = "Joyid";

// Connects to the wallet.
export async function connect() {
  const connection = await joyid.connect();
  return [connection.address];
}

// Gets the CKB address.
export function address(connection, ckbChainConfig) {
  const { args } = lumosHelpers.addressToScript(connection, {
    config: ckbChainConfig,
  });
  const scriptInfo = ckbChainConfig.SCRIPTS.JOYID;
  const script = {
    codeHash: scriptInfo.CODE_HASH,
    hashType: scriptInfo.HASH_TYPE,
    args,
  };
  return lumosHelpers.encodeToAddress(script, {
    config: ckbChainConfig,
  });
}

// Calls this function only when wallet is connected.
export async function sign(connection, message) {
  const resp = await joyid.signChallenge(message, connection);

  const seal = ["0x01", resp.pubkey];
  seal.push(bytes.hexify(signatureFromDer(resp.signature)).substring(2));
  seal.push(bytes.hexify(urlSafeBase64Decode(resp.message)).substring(2));
  return seal.join("");
}

function urlSafeBase64Decode(str) {
  const remainder = str.length % 4;
  if (remainder !== 0) {
    str = str + "=".repeat(4 - remainder);
  }
  return base64.toByteArray(str);
}

export function signatureFromDer(hexString) {
  const bytes = urlSafeBase64Decode(hexString);
  const xSize = Math.min(bytes[3], 32);
  const xPos = 4 + bytes[3] - xSize;
  const yPosOrig = xPos + xSize + 2;
  const ySize = Math.min(bytes[yPosOrig - 1], 32);
  const yPos = yPosOrig + bytes[yPosOrig - 1] - ySize;

  const signature = new Uint8Array(64);
  const xBase = 32 - xSize;
  for (let i = 0; i < xSize; i += 1) {
    signature[xBase + i] = bytes[xPos + i];
  }
  const yBase = 32 + 32 - ySize;
  for (let i = 0; i < xSize; i += 1) {
    signature[yBase + i] = bytes[yPos + i];
  }
  return signature;
}
