import * as joyid from "@joyid/ckb";

export default class Joyid {
  // Inits the wallet with options.
  constructor() {
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

  // Gets the username.
  //
  // Calls this function only when wallet is connected.
  username() {
    return this.connection.address;
  }

  // Gets the CKB address.
  //
  // Calls this function only when wallet is connected.
  address() {
    // TODO: use joyid-cobuild-poc lock address
    return this.connected() ? this.connection.address : null;
  }

  // Calls this function only when wallet is connected.
  //
  // TODO: figure out what message to sign
  async sign(message) {
    return joyid.signChallenge(message, this.connection.address);
  }
}
