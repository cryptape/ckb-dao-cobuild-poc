import { injectConfig } from "../runtime-config";
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

export default class Joyid {
  // Inits the wallet with options.
  constructor(config = injectConfig()) {
    this.ckbChainConfig = config.ckbChainConfig;
    this.scriptInfo = config.ckbChainConfig.SCRIPTS.JOYID_COBUILD_POC;
    this.connection = null;
  }

  // Connects to the wallet.
  async connect() {
    this.connection = await joyid.connect();
    return this.connection;
  }

  // Restores the wallet connection.
  //
  // - connection: this is the data returned from connect()
  restore(connection) {
    this.connection = connection;
  }

  // Checks whether the wallet is connected.
  connected() {
    return this.connection !== null && this.connection !== undefined;
  }

  // Gets the CKB address.
  //
  // Calls this function only when wallet is connected.
  address() {
    if (this.connected()) {
      const script = buildScript(
        `0x${this.connection.pubkey}`,
        this.scriptInfo,
      );
      return lumosHelpers.encodeToAddress(script, {
        config: this.ckbChainConfig,
      });
    }

    return null;
  }

  // Calls this function only when wallet is connected.
  //
  // TODO: figure out what message to sign
  async sign(message) {
    return joyid.signChallenge(message, this.connection.address);
  }
}
