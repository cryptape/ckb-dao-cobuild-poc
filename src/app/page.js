"use client";

import * as React from "react";
import { Button } from "flowbite-react";
import JoyID from "@/lib/wallet/joyid";

// Set the environment variable to use a predefined connection. This is helpful in development environment to avoid connecting after reload.
function predefinedConnection() {
  return process.env.NEXT_PUBLIC_JOYID_PUBKEY
    ? { pubkey: process.env.NEXT_PUBLIC_JOYID_PUBKEY }
    : null;
}

export default function Home() {
  const [connection, setConnection] = React.useState(predefinedConnection());
  const wallet = new JoyID();
  wallet.restore(connection);

  const onConnect = async () => {
    try {
      const connection = await wallet.connect();
      console.log(connection);
      setConnection(connection);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <main>
      {wallet.connected() ? (
        <>
          <p class="break-all">{wallet.address()}</p>
          <p>
            Claim testnet CKB from the{" "}
            <a href="https://faucet.nervos.org/">faucet</a>
          </p>
        </>
      ) : (
        <Button onClick={onConnect}>Connect</Button>
      )}
    </main>
  );
}
