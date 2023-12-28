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

// consider empty string as null
function presence(val) {
  return val !== "" ? val : null;
}

// assign source to dest, if source[key] is null or undefined, use dest[key]
function assign(dest, source) {
  for (const key in source) {
    dest[key] = source[key] ?? dest[key];
  }
  return dest;
}

function buildCkbChainConfig(ckbChain) {
  if (ckbChain in CKB_CHAINS_CONFIGS) {
    return CKB_CHAINS_CONFIGS[ckbChain];
  }

  // for custom env, duplicate from AGGRON4
  const template = CKB_CHAINS_CONFIGS.AGGRON4;
  const JOYID_COBUILD_POC = assign(
    { ...template.SCRIPTS.JOYID_COBUILD_POC },
    {
      CODE_HASH: presence(process.env.NEXT_PUBLIC_JOYID_COBUILD_POC_CODE_HASH),
      TX_HASH: presence(process.env.NEXT_PUBLIC_JOYID_COBUILD_POC_TX_HASH),
      INDEX: presence(process.env.NEXT_PUBLIC_JOYID_COBUILD_POC_INDEX) ?? "0x0",
    },
  );

  return {
    ...template,
    EXPLORER_URL: null,
    SCRIPTS: {
      ...template.SCRIPTS,
      JOYID_COBUILD_POC,
    },
  };
}

export const DEFAULT_CKB_CHAIN = "AGGRON4";
export const DEFAULT_CKB_RPC_URL = "https://testnet.ckbapp.dev/";

// () => {
//   ckbChain,
//   ckbRpcUrl,
//   ckbChainConfig
// }
export const useConfig = (() => {
  const ckbChain =
    presence(process.env.NEXT_PUBLIC_CKB_CHAIN) ?? DEFAULT_CKB_CHAIN;
  const config = {
    ckbChain,
    ckbRpcUrl:
      presence(process.env.NEXT_PUBLIC_CKB_RPC_URL) ?? DEFAULT_CKB_RPC_URL,
    ckbChainConfig: buildCkbChainConfig(ckbChain),
  };
  console.log(JSON.stringify(config, null, 2));
  return () => {
    return config;
  };
})();
