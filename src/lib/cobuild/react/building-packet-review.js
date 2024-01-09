"use client";

import { Accordion, Spinner } from "flowbite-react";

import { blockchain, utils as lumosBaseUtils } from "@ckb-lumos/base";
import { BI, formatUnit } from "@ckb-lumos/bi";
import * as lumosHelpers from "@ckb-lumos/helpers";

import { DaoActionData } from "@/lib/papps/dao/schema";
import { getDaoScriptHash } from "@/lib/papps/dao/script-info";

const { ckbHash } = lumosBaseUtils;

import {
  isDaoWithdrawCell,
  isDaoDepositCell,
  isNoneDaoTypedCell,
} from "../assets-manager";

function BriefAddress({ address }) {
  const display = `${address.slice(0, 15)}...${address.slice(-14)}`;
  return <span title={address}>{display}</span>;
}

function Capacity({ value }) {
  return value ? (
    <span className="inline-block h-6">{formatUnit(value, "ckb")}</span>
  ) : (
    <Spinner />
  );
}

function CapacityChange({ value }) {
  const plus = value?.isNegative() ? "" : "+";
  return value ? (
    <span className="inline-block h-6">
      {plus}
      {formatUnit(value, "ckb")}
    </span>
  ) : (
    <Spinner />
  );
}

function witnessLayoutDisplay(witnessStoreType) {
  return witnessStoreType
    .replace(/Store$/, "")
    .replace(/[A-Z]/g, " $&")
    .trim();
}

export default function BuildingPacketReview({
  buildingPacket,
  withdrawCellRewards,
  address,
  lockActionData,
  ckbChainConfig,
}) {
  const txHash = ckbHash(
    blockchain.RawTransaction.pack(buildingPacket.value.payload),
  );
  const assetsByAddress = groupAssetsByAddress(
    buildingPacket,
    withdrawCellRewards,
    ckbChainConfig,
  );
  const selfAssets = assetsByAddress[address];
  const othersAssets = Object.entries(assetsByAddress).filter(
    ([addr]) => addr !== address,
  );

  return (
    <Accordion className="not-prose">
      <Accordion.Panel>
        <Accordion.Title className="truncate ...">Transaction</Accordion.Title>
        <Accordion.Content>
          <TxSection
            {...{
              buildingPacket,
              withdrawCellRewards,
              ckbChainConfig,
              txHash,
              lockActionData,
            }}
          ></TxSection>
        </Accordion.Content>
      </Accordion.Panel>
      <Accordion.Panel>
        <Accordion.Title>
          <span className="mr-2">You</span>{" "}
          <span className="text-sm font-normal">
            <CapacityChange value={selfAssets.ckbIncome} /> CKB
          </span>
        </Accordion.Title>
        <Accordion.Content>
          <AssetsSection address={address} assets={selfAssets} />
        </Accordion.Content>
      </Accordion.Panel>
      {othersAssets.map(([address, assets]) => (
        <Accordion.Panel key={address}>
          <Accordion.Title>
            <span className="mr-2">
              <BriefAddress address={address} />
            </span>{" "}
            <span className="text-sm font-normal">
              <CapacityChange value={assets.ckbIncome} /> CKB
            </span>
          </Accordion.Title>
          <Accordion.Content>
            <AssetsSection address={address} assets={assets} />
          </Accordion.Content>
        </Accordion.Panel>
      ))}
    </Accordion>
  );
}

export function DaoOperationReview({ op, ckbChainConfig }) {
  if (op.type === "Deposit") {
    return (
      <li className="break-all">
        Deposit {formatUnit(op.value.capacity, "ckb")} to{" "}
        {lumosHelpers.encodeToAddress(op.value.lock, {
          config: ckbChainConfig,
        })}
      </li>
    );
  } else if (op.type === "Withdraw") {
    return (
      <li className="break-all">
        Withdraw output {op.value.previousOutput.index} of transaction{" "}
        {op.value.previousOutput.txHash}.
      </li>
    );
  } else if (op.type === "Claim") {
    return (
      <li className="break-all">
        Claim output {op.value.previousOutput.index} of transaction{" "}
        {op.value.previousOutput.txHash}, the total claimed amount is{" "}
        {formatUnit(op.value.totalClaimedCapacity, "ckb")}
      </li>
    );
  } else {
    return <li>{op.type}</li>;
  }
}

export function DaoActionReview({ action, unpackedData, ckbChainConfig }) {
  const ops =
    unpackedData.type === "SingleOperation"
      ? [unpackedData.value]
      : unpackedData.value;

  return (
    <div>
      <div>
        <strong>DAO</strong>
        <ol>
          {ops.map((op, i) => (
            <DaoOperationReview
              key={`dao-${action.scriptHash}-${i}`}
              op={op}
              ckbChainConfig={ckbChainConfig}
            />
          ))}
        </ol>
      </div>
    </div>
  );
}

export function ActionReview({ action, ckbChainConfig }) {
  if (action.scriptHash === getDaoScriptHash()) {
    return DaoActionReview({
      action,
      ckbChainConfig,
      unpackedData: DaoActionData.unpack(action.data),
    });
  }
  return (
    <pre className="font-mono p-4 bg-slate-800 text-slate-300 rounded overflow-scroll">
      {JSON.stringify(action, null, 2)}
    </pre>
  );
}

export function TxSection({
  buildingPacket,
  withdrawCellRewards,
  ckbChainConfig,
  lockActionData,
  txHash,
}) {
  const fee = calculateTransactionFee(
    buildingPacket,
    withdrawCellRewards,
    ckbChainConfig,
  );

  return (
    <dl className="divide-y divide-gray-100">
      {process.env.DEBUG !== undefined ? (
        <div className="x-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
          <dt className="leading-6 text-gray-900">Hash</dt>
          <dd className="text-gray-700 sm:col-span-2 sm:mt-0 break-all">
            <pre className="font-mono p-4 bg-slate-800 text-slate-300 rounded overflow-scroll">
              {JSON.stringify(buildingPacket, null, 2)}
            </pre>
          </dd>
        </div>
      ) : null}
      <div className="x-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
        <dt className="leading-6 text-gray-900">Hash</dt>
        <dd className="text-gray-700 sm:col-span-2 sm:mt-0 break-all">
          {txHash}
        </dd>
      </div>
      <div className="x-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
        <dt className="leading-6 text-gray-900">Fee</dt>
        <dd className="text-gray-700 sm:col-span-2 sm:mt-0">
          <Capacity value={fee} /> CKB
        </dd>
      </div>
      <div className="x-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
        <dt className="leading-6 text-gray-900">Your Challenge</dt>
        <dd className="text-gray-700 sm:col-span-2 sm:mt-0 break-all">
          {lockActionData.digest}
        </dd>
      </div>
      <div className="x-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
        <dt className="leading-6 text-gray-900">Your Witness Layout</dt>
        <dd className="text-gray-700 sm:col-span-2 sm:mt-0">
          {witnessLayoutDisplay(lockActionData.witnessStore.type)}
        </dd>
      </div>
      <div className="x-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
        <dt className="leading-6 text-gray-900">Message</dt>
        <dd className="text-gray-700 divide-y divide-gray-100 space-y-4 sm:col-span-2 sm:mt-0">
          {buildingPacket.value.message.actions.map((action) => (
            <ActionReview
              key={`action-${action.scriptHash}`}
              action={action}
              ckbChainConfig={ckbChainConfig}
            />
          ))}
        </dd>
      </div>
    </dl>
  );
}

export function AssetsSection({ address, assets }) {
  return (
    <dl className="divide-y divide-gray-100">
      <div className="x-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
        <dt className="leading-6 text-gray-900">Address</dt>
        <dd className="text-gray-700 sm:col-span-2 sm:mt-0 break-all">
          {address}
        </dd>
      </div>
      <div className="x-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
        <dt className="leading-6 text-gray-900">CKB</dt>
        <dd className="text-gray-700 sm:col-span-2 sm:mt-0">
          <CapacityChange value={assets.ckbIncome} />
        </dd>
      </div>
      {assets.daoDeposited.isZero() ? null : (
        <div className="x-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
          <dt className="leading-6 text-gray-900">DAO (Deposited)</dt>
          <dd className="text-gray-700 sm:col-span-2 sm:mt-0">
            <Capacity value={assets.daoDeposited} />
          </dd>
        </div>
      )}
      {assets.daoWithdrawn.isZero() ? null : (
        <div className="x-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
          <dt className="leading-6 text-gray-900">DAO (Withdrawn)</dt>
          <dd className="text-gray-700 sm:col-span-2 sm:mt-0">
            <Capacity value={assets.daoWithdrawn} />
          </dd>
        </div>
      )}
      {assets.daoClaimedBase.isZero() ? null : (
        <div className="x-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
          <dt className="leading-6 text-gray-900">DAO (Claimed)</dt>
          <dd className="text-gray-700 sm:col-span-2 sm:mt-0">
            <Capacity value={assets.daoClaimedBase} /> +
            <Capacity value={assets.daoClaimedReward} />
          </dd>
        </div>
      )}
    </dl>
  );
}

function groupAssetsByAddress(
  buildingPacket,
  withdrawCellRewards,
  ckbChainConfig,
) {
  let indicesByAddress = {};
  const defaultEntry = () => ({ inputs: [], outputs: [] });
  for (const [
    i,
    cell,
  ] of buildingPacket.value.resolvedInputs.outputs.entries()) {
    const address = lumosHelpers.encodeToAddress(cell.lock, {
      config: ckbChainConfig,
    });
    const assetsEntry = (indicesByAddress[address] ??= defaultEntry());
    assetsEntry.inputs.push(i);
  }
  for (const [i, cell] of buildingPacket.value.payload.outputs.entries()) {
    const address = lumosHelpers.encodeToAddress(cell.lock, {
      config: ckbChainConfig,
    });
    const assetsEntry = (indicesByAddress[address] ??= defaultEntry());
    assetsEntry.outputs.push(i);
  }
  return Object.fromEntries(
    Object.entries(indicesByAddress).map(([address, { inputs, outputs }]) => [
      address,
      collectAssets(
        buildingPacket,
        withdrawCellRewards,
        inputs,
        outputs,
        ckbChainConfig,
      ),
    ]),
  );
}

function collectAssets(
  buildingPacket,
  withdrawCellRewards,
  inputs,
  outputs,
  ckbChainConfig,
) {
  const assets = {
    ckbIncome: BI.from(0),
    daoDeposited: BI.from(0),
    daoWithdrawn: BI.from(0),
    daoClaimedBase: BI.from(0),
    daoClaimedReward: BI.from(0),
    destroyedTypedCells: [],
    createdTypedCells: [],
  };

  for (const i of inputs) {
    const cellOutput = buildingPacket.value.resolvedInputs.outputs[i];
    const cellData = buildingPacket.value.resolvedInputs.outputsData[i];
    const cellCapacity = BI.from(cellOutput.capacity);
    assets.ckbIncome = assets.ckbIncome.sub(cellCapacity);

    if (isDaoWithdrawCell(cellOutput, cellData, ckbChainConfig)) {
      assets.daoClaimedBase = assets.daoClaimedBase.add(cellCapacity);
      const reward = withdrawCellRewards[i];
      if (reward === null || reward === undefined) {
        assets.daoClaimedReward = null;
      } else if (assets.daoClaimedReward) {
        assets.daoClaimedReward = assets.daoClaimedReward.add(BI.from(reward));
      }
    } else if (isDaoDepositCell(cellOutput, cellData, ckbChainConfig)) {
      assets.daoWithdrawn = assets.daoWithdrawn.add(cellCapacity);
    } else if (isNoneDaoTypedCell(cellOutput, cellData, ckbChainConfig)) {
      assets.destroyedTypedCells.push({
        cellOutput,
        outPoint: buildingPacket.value.packet.inputs[i].previousOutput,
        data: cellData,
      });
    }
  }
  for (const i of outputs) {
    const cellOutput = buildingPacket.value.payload.outputs[i];
    const cellData = buildingPacket.value.payload.outputsData[i];
    const cellCapacity = BI.from(cellOutput.capacity);
    assets.ckbIncome = assets.ckbIncome.add(cellCapacity);

    if (isDaoDepositCell(cellOutput, cellData, ckbChainConfig)) {
      assets.daoDeposited = assets.daoDeposited.add(cellCapacity);
    } else if (isNoneDaoTypedCell(cellOutput, cellData, ckbChainConfig)) {
      assets.createdTypedCells.push({
        outPoint: buildingPacket.value.packet.inputs[i].previousOutput,
        data: cellData,
      });
    }
  }

  if (assets.daoClaimedReward === null) {
    assets.ckbIncome = null;
  }

  return assets;
}

function calculateTransactionFee(
  buildingPacket,
  withdrawCellRewards,
  ckbChainConfig,
) {
  let balance = BI.from(0);
  for (const [
    i,
    cellOutput,
  ] of buildingPacket.value.resolvedInputs.outputs.entries()) {
    balance = balance.add(BI.from(cellOutput.capacity));
    const cellData = buildingPacket.value.resolvedInputs.outputsData[i];
    if (isDaoWithdrawCell(cellOutput, cellData, ckbChainConfig)) {
      const reward = withdrawCellRewards[i];
      if (reward === null || reward === undefined) {
        return null;
      }
      balance = balance.add(BI.from(reward));
    }
  }
  for (const cellOutput of buildingPacket.value.payload.outputs) {
    balance = balance.sub(BI.from(cellOutput.capacity));
  }

  return balance;
}
