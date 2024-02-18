"use client";

import { Alert, Checkbox, Label, Popover, TextInput } from "flowbite-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useFormState } from "react-dom";

import deposit from "@/actions/deposit";
import { fetchAssetsWithCache } from "@/actions/fetch-assets";
import Capacity from "@/components/capacity";
import PackingVerifierHelpText from "@/components/packing-verifier-help-text";
import SubmitButton from "@/components/submit-button";
import Loading from "../loading";
import SignForm from "../sign-form";
import SubmitBuildingPacket from "../submit-building-packet";

export function TransactionForm({ formAction, formState, address }) {
  const [balance, setBalance] = useState();
  useEffect(() => {
    fetchAssetsWithCache(address).then(({ ckbBalance }) =>
      setBalance(ckbBalance),
    );
  }, [address, setBalance]);

  return (
    <form className="flex flex-col gap-4" action={formAction}>
      {formState.error ? (
        <Alert color="failure">{formState.error}</Alert>
      ) : null}
      <div>
        <Label htmlFor="from" value="From" />
        <TextInput id="from" name="from" value={address} readOnly required />
      </div>
      <div>
        <Label htmlFor="amount" value="Amount (CKB)" />
        <TextInput
          id="amount"
          name="amount"
          type="number"
          placeholder="0.0"
          step="0.00000001"
          min="78"
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
      <div>
        <Checkbox className="mr-2" id="packVerifier" name="packVerifier" />
        <Label htmlFor="packVerifier">
          Pack Verifier (<PackingVerifierHelpText />)
        </Label>
      </div>
      <SubmitButton>Deposit</SubmitButton>
    </form>
  );
}

export default function DepositForm({ wallet, connection, address, config }) {
  const router = useRouter();
  const [formState, formAction] = useFormState(deposit, {});
  const [signedBuildingPacket, setSignedBuildingPacket] = useState(null);
  const back = () => router.back();

  if (
    formState.buildingPacket === null ||
    formState.buildingPacket === undefined
  ) {
    return <TransactionForm {...{ formAction, formState, address }} />;
  } else if (
    signedBuildingPacket === null ||
    signedBuildingPacket === undefined
  ) {
    return (
      <SignForm
        wallet={wallet}
        connection={connection}
        address={address}
        buildingPacket={formState.buildingPacket}
        ckbChainConfig={config.ckbChainConfig}
        onSubmit={setSignedBuildingPacket}
        onCancel={back}
      />
    );
  } else {
    return (
      <SubmitBuildingPacket
        buildingPacket={signedBuildingPacket}
        ckbChainConfig={config.ckbChainConfig}
        onClose={back}
      />
    );
  }
}
