import { predefined } from "@ckb-lumos/config-manager";

export const ENV_CKB_CHAIN = "NEXT_PUBLIC_CKB_CHAIN";
export const ENV_CKB_RPC_URL = "NEXT_PUBLIC_CKB_RPC_URL";

const ENV_KEYS = [ENV_CKB_CHAIN, ENV_CKB_RPC_URL];

const DEFAULT_ENV = {
  [ENV_CKB_CHAIN]: "AGGRON4",
  [ENV_CKB_RPC_URL]: "https://testnet.ckbapp.dev/",
};

const CKB_ENVS = {
  AGGRON4: {
    ...predefined.AGGRON4,
    SCRIPTS: {
      ...predefined.AGGRON4.SCRIPTS,
      JOYID_COBUILD_POC: {
        CODE_HASH:
          "0x04dd652246af5f32ae10c04821ae32bff3dce37da52b6c60354c8ba867959e1e",
        HASH_TYPE: "type",
        TX_HASH:
          "0x53ba0900742334d2283f321ae17324efb3846fa38ba4bd47542f6d508db13b0b",
        INDEX: "0x0",
        DEP_TYPE: "code",
      },
    },
  },
};

export default class RuntimeConfig {
  constructor(env) {
    this.env = { ...DEFAULT_ENV };
    for (const key of ENV_KEYS) {
      if (env[key] !== undefined && env[key] !== null) {
        this.env[key] = env[key];
      }
    }

    this.ckbChainConfig =
      typeof this.env[ENV_CKB_CHAIN] === "string"
        ? CKB_ENVS[this.env[ENV_CKB_CHAIN]]
        : this.env[ENV_CKB_CHAIN];
  }

  getCkbRpcUrl() {
    return this.env[ENV_CKB_RPC_URL];
  }
}

export const injectConfig = (function () {
  let config = undefined;
  return function () {
    if (config === undefined) {
      config = new RuntimeConfig(process.env);
    }

    return config;
  };
})();
