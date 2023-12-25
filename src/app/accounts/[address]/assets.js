import Link from "next/link";
import { Button } from "flowbite-react";
import Capacity from "@/components/capacity";
import fetchAssets from "@/actions/fetch-assets";

export const revalidate = 12;

export default async function Assets({ address }) {
  const assets = await fetchAssets(address);

  return (
    <>
      <p>
        <Capacity value={assets.ckbBalance} />
      </p>
      <Button
        as={Link}
        href={`/accounts/${address}/transfer`}
        className="not-prose"
      >
        Transfer
      </Button>
    </>
  );
}
