import * as joyid from "@joyid/ckb";
import { bytes } from "@ckb-lumos/codec";
import { utils as lumosBaseUtils } from "@ckb-lumos/base";
import * as lumosHelpers from "@ckb-lumos/helpers";
import base64 from "base64-js";

const ckbHash = lumosBaseUtils.ckbHash;

function buildScript(pubkey, scriptInfo) {
  // first 20 bytes
  const args = ckbHash(pubkey).substring(0, 42);
  return {
    codeHash: scriptInfo.CODE_HASH,
    hashType: scriptInfo.HASH_TYPE,
    args,
  };
}

// Connects to the wallet.
export async function connect() {
  return await joyid.connect();
}

// Gets the CKB address.
//
// Calls this function only when wallet is connected.
export function address(connection, ckbChainConfig) {
  if (connection !== null && connection !== undefined) {
    const scriptInfo = ckbChainConfig.SCRIPTS.JOYID_COBUILD_POC;

    const script = buildScript(`0x${connection.pubkey}`, scriptInfo);
    return lumosHelpers.encodeToAddress(script, {
      config: ckbChainConfig,
    });
  }

  return null;
}

// Calls this function only when wallet is connected.
export async function sign(address, message, ckbChainConfig) {
  const resp = await joyid.signChallenge(
    message,
    toJoyidAddress(address, ckbChainConfig),
  );

  const seal = ["0x", resp.pubkey];
  seal.push(bytes.hexify(signatureFromDer(resp.signature)).substring(2));
  seal.push(bytes.hexify(urlSafeBase64Decode(resp.message)).substring(2));
  return seal.join("");
}

function toJoyidAddress(address, ckbChainConfig) {
  const scriptInfo = ckbChainConfig.SCRIPTS.JOYID;
  const script = lumosHelpers.addressToScript(address, {
    config: ckbChainConfig,
  });
  // add prefix
  const args = "0x0001" + script.args.substring(2);
  const joyidScript = {
    codeHash: scriptInfo.CODE_HASH,
    hashType: scriptInfo.HASH_TYPE,
    args,
  };
  return lumosHelpers.encodeToAddress(joyidScript, { config: ckbChainConfig });
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
