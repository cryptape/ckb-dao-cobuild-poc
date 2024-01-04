import { addressToScript } from "@ckb-lumos/helpers";
import { parseUnit } from "@ckb-lumos/bi";

function addressToScriptOpt(address, lumosOptions) {
  if (address !== null && address !== undefined) {
    address = address.trim();
    if (address !== "") {
      return addressToScript(address, lumosOptions);
    }
  }
  return undefined;
}

function buildSingleOperation(operation) {
  return {
    type: "SingleOperation",
    value: operation,
  };
}

export function depositWithFormData(config, formData) {
  const lumosOptions = { config: config.ckbChainConfig };

  const lock = addressToScript(formData.get("lock"), lumosOptions);
  const capacity = parseUnit(formData.get("capacity"), "ckb");
  const from = addressToScriptOpt(formData.get("from"), lumosOptions);
  return deposit({ lock, capacity, from }, config);
}

export function deposit({ lock, capacity, from = undefined }) {
  return buildSingleOperation(
    from === null || from === undefined
      ? {
          type: "Deposit",
          value: { lock, capacity },
        }
      : {
          type: "DepositFrom",
          value: { lock, capacity, from },
        },
  );
}

export function withdrawWithFormData(config, formData) {
  const lumosOptions = { config: config.ckbChainConfig };

  const previousOutput = {
    txHash: formData.get("previousOutput.txHash"),
    index: parseInt(formData.get("previousOutput.index"), 10),
  };
  const to = addressToScriptOpt(formData.get("to"), lumosOptions);
  return withdraw({ previousOutput, to }, config);
}

export function withdraw({ previousOutput, to = undefined }) {
  return buildSingleOperation(
    to === null || to === undefined
      ? {
          type: "Withdraw",
          value: { previousOutput },
        }
      : {
          type: "WithdrawTo",
          value: { previousOutput, to },
        },
  );
}

export function claimWithFormData(config, formData) {
  const lumosOptions = { config: config.ckbChainConfig };

  const previousOutput = {
    txHash: formData.get("previousOutput.txHash"),
    index: parseInt(formData.get("previousOutput.index"), 10),
  };
  const to = addressToScriptOpt(formData.get("to"), lumosOptions);
  return claim({ previousOutput, to }, config);
}

export function claim({ previousOutput, to = undefined }) {
  // Set a dummy value, which will be set by the script later.
  const totalClaimedCapacity = 0;
  return buildSingleOperation(
    to === null || to === undefined
      ? {
          type: "Claim",
          value: { previousOutput, totalClaimedCapacity },
        }
      : {
          type: "ClaimTo",
          value: { previousOutput, totalClaimedCapacity, to },
        },
  );
}
