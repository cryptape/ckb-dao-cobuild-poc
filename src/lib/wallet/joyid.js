import * as joyid from "@joyid/ckb";
import { utils as lumosBaseUtils } from "@ckb-lumos/base";
import * as lumosHelpers from "@ckb-lumos/helpers";

const ckbHash = lumosBaseUtils.ckbHash;

function buildScript(pubkey, scriptInfo) {
  const args = ckbHash(pubkey);
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
export async function sign(connection, message) {
  return await joyid.signChallenge(message, connection.address);
}
