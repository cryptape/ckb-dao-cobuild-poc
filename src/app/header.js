"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "flowbite-react";

import * as joyid from "@/lib/wallet/joyid";
import SubmitButton from "@/components/submit-button";

export default function RootClientPage({ config }) {
  const router = useRouter();
  const [error, setError] = useState();

  const connect = async () => {
    try {
      const connection = await joyid.connect();
      const address = joyid.address(connection, config.ckbChainConfig);
      router.push(`/accounts/${address}`);
    } catch (err) {
      setError(err.toString());
    }
  };

  return (
    <form action={connect}>
      {error ? (
        <Alert className="block mb-5" color="failure">
          {error}
        </Alert>
      ) : null}
      <SubmitButton>Connect</SubmitButton>
    </form>
  );
}
