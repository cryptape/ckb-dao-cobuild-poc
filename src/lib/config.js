import { predefined } from "@ckb-lumos/config-manager";

const CKB_CHAINS_CONFIGS = {
  AGGRON4: {
    ...predefined.AGGRON4,
    EXPLORER_URL: "https://pudge.explorer.nervos.org",
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
      JOYID: {
        CODE_HASH:
          "0xd23761b364210735c19c60561d213fb3beae2fd6172743719eff6920e020baac",
        HASH_TYPE: "type",
      },
    },
  },
};

const NEXT_PUBLIC_PREFIX = "NEXT_PUBLIC_";
const ENV_VARIABLE_NAMES = {
  ckbChain: "CKB_CHAIN",
  ckbRpcUrl: "CKB_RPC_URL",
  ckbChainConfig: "CKB_CHAIN_CONFIG",
};

export function configFromEnv(env) {
  const config = defaultConfig();

  for (const key in config) {
    const envName = ENV_VARIABLE_NAMES[key];
    if (envName !== undefined) {
      config[key] =
        env[envName] ?? env[NEXT_PUBLIC_PREFIX + envName] ?? config[key];
    }
  }

  config.ckbChainConfig ??= CKB_CHAINS_CONFIGS[config.ckbChain];
  if (typeof config.ckbChainConfig === "string") {
    config.ckbChainConfig = JSON.load(config.ckbChainConfig);
  }

  return config;
}

export const DEFAULT_CKB_CHAIN = "AGGRON4";

// () => {
//   ckbChain,
//   ckbRpcUrl,
//   ckbChainConfig
// }
export function defaultConfig() {
  return {
    ckbChain: DEFAULT_CKB_CHAIN,
    ckbRpcUrl: "https://testnet.ckbapp.dev/",
    ckbChainConfig: CKB_CHAINS_CONFIGS[DEFAULT_CKB_CHAIN],
  };
}
