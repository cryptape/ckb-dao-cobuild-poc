import { getConfig } from "@/lib/config";

import { getDaoHumanScriptInfoTemplate } from "./script-info";
import {
  deposit,
  depositWithFormData,
  withdraw,
  withdrawWithFormData,
  claim,
  claimWithFormData,
} from "./action-creators";
import bindCallbacks from "./lumos-callbacks";

export function getDaoPappRegistry(config) {
  config = config ?? getConfig();

  return {
    humanScriptInfoTemplate: getDaoHumanScriptInfoTemplate(),
    lumosScriptInfo: config.ckbChainConfig.SCRIPTS.DAO,
    creators: { deposit, withdraw, claim },
    formDataCreators: {
      deposit: depositWithFormData.bind(null, config),
      withdraw: withdrawWithFormData.bind(null, config),
      claim: claimWithFormData.bind(null, config),
    },
    callbacks: bindCallbacks(config),
  };
}

export default getDaoPappRegistry;
