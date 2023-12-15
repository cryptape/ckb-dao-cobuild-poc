"use client";

import * as React from "react";
import { Button } from "flowbite-react";
import JoyID from "@/lib/wallet/joyid";

export default function Home() {
  const [connection, setConnection] = React.useState(null);
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

  const onSign = async () => {
    const res = await wallet.sign("hello");
    if (res) {
      console.log(`Sign message result: ${res}`);
    }
  };

  return (
    <main>
      {wallet.connected() ? (
        <Button onClick={onSign}>Sign</Button>
      ) : (
        <Button onClick={onConnect}>Connect</Button>
      )}
    </main>
  );
}
