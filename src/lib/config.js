import { predefined } from "@ckb-lumos/config-manager";

const CKB_CHAINS_CONFIGS = {
  AGGRON4: {
    ...predefined.AGGRON4,
    EXPLORER_URL: "https://pudge.explorer.nervos.org",
    SCRIPTS: {
      ...predefined.AGGRON4.SCRIPTS,

      JOYID: {
        CODE_HASH:
          "0xd23761b364210735c19c60561d213fb3beae2fd6172743719eff6920e020baac",
        HASH_TYPE: "type",
        TX_HASH:
          "0x4dcf3f3b09efac8995d6cbee87c5345e812d310094651e0c3d9a730f32dc9263",
        INDEX: "0x0",
        DEP_TYPE: "depGroup",
      },
      // Disable OMNILOCK bundled in lumos
      OMNILOCK: undefined,
      OMNILOCK_CUSTOM: {
        CODE_HASH:
          "0xf329effd1c475a2978453c8600e1eaf0bc2087ee093c3ee64cc96ec6847752cb",
        HASH_TYPE: "type",
        TX_HASH:
          "0x3d4296df1bd2cc2bd3f483f61ab7ebeac462a2f336f2b944168fe6ba5d81c014",
        INDEX: "0x0",
        DEP_TYPE: "code",
      },

      DAO_ACTION_VERIFIER: {
        CODE_HASH:
          "0xbdca5b74e5d0c913fed19d8482a99af1ef8a639541438b2e00189f5e18907ef9",
        HASH_TYPE: "type",
        TX_HASH:
          "0x9157bcc278176ba9e823a50d72631be9e9b964e7a5ca11db2782c059c4c788ad",
        INDEX: "0x0",
        DEP_TYPE: "code",
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

  const JOYID = assign(
    { ...template.SCRIPTS.JOYID },
    {
      CODE_HASH: presence(process.env.NEXT_PUBLIC_JOYID_CODE_HASH),
      TX_HASH: presence(process.env.NEXT_PUBLIC_JOYID_TX_HASH),
    },
  );
  const OMNILOCK_CUSTOM = assign(
    { ...template.SCRIPTS.OMNILOCK_CUSTOM },
    {
      CODE_HASH: presence(process.env.NEXT_PUBLIC_OMNILOCK_CODE_HASH),
      TX_HASH: presence(process.env.NEXT_PUBLIC_OMNILOCK_TX_HASH),
    },
  );
  const DAO_ACTION_VERIFIER = assign(
    { ...template.SCRIPTS.DAO_ACTION_VERIFIER },
    {
      CODE_HASH: presence(
        process.env.NEXT_PUBLIC_DAO_ACTION_VERIFIER_CODE_HASH,
      ),
      TX_HASH: presence(process.env.NEXT_PUBLIC_DAO_ACTION_VERIFIER_TX_HASH),
    },
  );

  const tx0 =
    presence(process.env.NEXT_PUBLIC_CKB_GENESIS_TX_0) ??
    template.SCRIPTS.DAO.TX_HASH;
  const tx1 =
    presence(process.env.NEXT_PUBLIC_CKB_GENESIS_TX_1) ??
    template.SCRIPTS.SECP256K1_BLAKE160.TX_HASH;

  return {
    ...template,
    EXPLORER_URL: null,
    SCRIPTS: {
      JOYID,
      OMNILOCK_CUSTOM,
      DAO_ACTION_VERIFIER,
      DAO: {
        ...template.SCRIPTS.DAO,
        TX_HASH: tx0,
      },
      SECP256K1_BLAKE160: {
        ...template.SCRIPTS.SECP256K1_BLAKE160,
        TX_HASH: tx1,
      },
      SECP256K1_BLAKE160_MULTISIG: {
        ...template.SCRIPTS.SECP256K1_BLAKE160_MULTISIG,
        TX_HASH: tx1,
      },
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
export const getConfig = (() => {
  const ckbChain =
    presence(process.env.NEXT_PUBLIC_CKB_CHAIN) ?? DEFAULT_CKB_CHAIN;
  const config = {
    ckbChain,
    ckbRpcUrl:
      presence(process.env.NEXT_PUBLIC_CKB_RPC_URL) ?? DEFAULT_CKB_RPC_URL,
    ckbChainConfig: buildCkbChainConfig(ckbChain),
  };

  return () => {
    return config;
  };
})();

export function getTestnetConfig() {
  return {
    ckbChain: DEFAULT_CKB_RPC_URL,
    ckbRpcUrl: DEFAULT_CKB_CHAIN,
    ckbChainConfig: CKB_CHAINS_CONFIGS[DEFAULT_CKB_CHAIN],
  };
}

export function buildCellDep(scriptInfo) {
  return {
    outPoint: {
      txHash: scriptInfo.TX_HASH,
      index: scriptInfo.INDEX,
    },
    depType: scriptInfo.DEP_TYPE,
  };
}

export function buildScript(scriptInfo, args) {
  return {
    codeHash: scriptInfo.CODE_HASH,
    hashType: scriptInfo.HASH_TYPE,
    args,
  };
}
