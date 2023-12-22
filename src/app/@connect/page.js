"use client";

import { Button } from "flowbite-react";
import { useRouter } from "next/navigation";

import * as joyid from "@/lib/wallet/joyid";
import { configFromEnv } from "@/lib/config";

export default function Connect() {
  const config = configFromEnv(process.env);
  const router = useRouter();

  const connect = async () => {
    const connection = await joyid.connect();
    const address = joyid.address(connection, config.ckbChainConfig);
    router.push(`/accounts/${address}`);
  };

  return <Button onClick={connect}>Connect</Button>;
}
