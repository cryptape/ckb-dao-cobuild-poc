"use client";

import * as React from "react";
import { Button } from "flowbite-react";
import * as joyid from "@/lib/wallet/joyid";
import { injectConfig } from "@/lib/runtime-config";

function getConfiguredConnection() {
  return process.env.NODE_ENV === "development" &&
    process.env.NEXT_PUBLIC_JOYID_PUBKEY
    ? { pubkey: process.env.NEXT_PUBLIC_JOYID_PUBKEY }
    : null;
}

function useConnection(configuredConnection) {
  const [connection, setConnection] = React.useState(configuredConnection);

  const connect = async () => {
    try {
      const connection = await joyid.connect();
      console.log(connection);
      setConnection(connection);
    } catch (error) {
      console.log(error);
    }
  };

  return [connection, connect];
}

export function ConfiguredHome({ config, configuredConnection }) {
  const [connection, connect] = useConnection(configuredConnection);

  return (
    <main>
      {connection !== null ? (
        <>
          <p class="break-all">
            {joyid.address(connection, config.ckbChainConfig)}
          </p>
          <p>
            Claim testnet CKB from the{" "}
            <a href="https://faucet.nervos.org/">faucet</a>
          </p>
        </>
      ) : (
        <Button onClick={connect}>Connect</Button>
      )}
    </main>
  );
}

export default function Home() {
  return ConfiguredHome({
    config: injectConfig(),
    configuredConnection: getConfiguredConnection(),
  });
}
