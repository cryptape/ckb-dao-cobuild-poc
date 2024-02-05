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

  const from = addressToScript(formData.get("from"), lumosOptions);
  const amount = { shannons: parseUnit(formData.get("amount"), "ckb") };
  return deposit({ from, amount, to: from }, config);
}

export function deposit({ from, to, amount }) {
  return {
    deposits: [{ from, to, amount }],
    withdraws: [],
    claims: [],
  };
}

export function withdrawWithFormData(config, formData) {
  const lumosOptions = { config: config.ckbChainConfig };

  const cellPointer = {
    txHash: formData.get("cellPointer.txHash"),
    index: parseInt(formData.get("cellPointer.index"), 10),
  };
  const to = addressToScriptOpt(formData.get("to"), lumosOptions);
  return withdraw({ cellPointer, to }, config);
}

export function withdraw({ cellPointer, to = undefined }) {
  return {
    deposits: [],
    withdraws: [{ cellPointer, to }],
    claims: [],
  };
}

export function claimWithFormData(config, formData) {
  const lumosOptions = { config: config.ckbChainConfig };

  const cellPointer = {
    txHash: formData.get("cellPointer.txHash"),
    index: parseInt(formData.get("cellPointer.index"), 10),
  };
  const to = addressToScriptOpt(formData.get("to"), lumosOptions);
  return claim({ cellPointer, to }, config);
}

export function claim({ cellPointer, to = undefined }) {
  return {
    deposits: [],
    withdraws: [],
    claims: [{ cellPointer, to }],
  };
}
