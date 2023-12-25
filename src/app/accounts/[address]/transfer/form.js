"use client";

import { useEffect, useState } from "react";
import { useFormState } from "react-dom";
import { Label, TextInput, Alert } from "flowbite-react";

import Capacity from "@/components/capacity";
import SubmitButton from "@/components/submit-button";
import fetchAssets from "@/actions/fetch-assets";
import transfer from "@/actions/transfer";
import Loading from "../loading";
import SignForm from "../sign-form";

export function TransactionForm({ formAction, formState, address }) {
  const [balance, setBalance] = useState();
  useEffect(() => {
    fetchAssets(address).then(({ ckbBalance }) => setBalance(ckbBalance));
  }, [address]);

  return (
    <form className="flex flex-col gap-4" action={formAction}>
      {formState.error ? (
        <Alert color="failure">
          <span className="font-medium">Error:</span> {formState.error}
        </Alert>
      ) : null}
      <div>
        <Label htmlFor="from" value="From" />
        <TextInput id="from" name="from" value={address} readOnly required />
      </div>
      <div>
        <Label htmlFor="to" value="To" />
        <TextInput id="to" name="to" placeholder="ckt..." required />
      </div>
      <div>
        <Label htmlFor="amount" value="Amount (CKB)" />
        <TextInput
          id="amount"
          name="amount"
          type="number"
          placeholder="0.0"
          step="0.00000001"
          min="61"
          required
          helperText={
            <>
              Balance:{" "}
              {balance ? (
                <Capacity className="inline-block h-6" value={balance} />
              ) : (
                <Loading />
              )}
            </>
          }
        />
      </div>
      <SubmitButton>Transfer</SubmitButton>
    </form>
  );
}

export default function TransferForm({ address, config }) {
  const [formState, formAction] = useFormState(transfer, {});

  return formState.buildingPacket === null ||
    formState.buildingPacket === undefined ? (
    <TransactionForm {...{ formAction, formState, address }} />
  ) : (
    <SignForm
      address={address}
      buildingPacket={formState.buildingPacket}
      ckbChainConfig={config.ckbChainConfig}
    />
  );
}
