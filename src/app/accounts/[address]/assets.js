import Link from "next/link";
import { Button } from "flowbite-react";
import Capacity from "@/components/capacity";
import { fetchAssetsWithCache } from "@/actions/fetch-assets";
import DaoCells from "./dao-cells";
import Loading from "./loading";

export const revalidate = 12;

export function CkbSection({ address, ckbBalance }) {
  return (
    <section>
      <h2>CKB</h2>
      <p>
        Balance: <Capacity value={ckbBalance} />
      </p>
      <Button
        as={Link}
        href={`/accounts/${address}/transfer`}
        className="not-prose"
      >
        Transfer
      </Button>
    </section>
  );
}

export function DaoSection({ address, daoCells }) {
  return (
    <section>
      <h2>DAO</h2>
      <aside className="mb-5">
        <Button
          as={Link}
          href={`/accounts/${address}/deposit`}
          className="not-prose"
        >
          Deposit
        </Button>
      </aside>
      <DaoCells address={address} daoCells={daoCells} />
    </section>
  );
}

export function AssetsFallback() {
  return (
    <>
      <section>
        <h2>CKB</h2>
        <Loading />
      </section>
      <section>
        <h2>DAO</h2>
        <Loading />
      </section>
    </>
  );
}

export default async function Assets({ address }) {
  const { ckbBalance, daoCells } = await fetchAssetsWithCache(address);

  return (
    <>
      <CkbSection address={address} ckbBalance={ckbBalance} />
      <DaoSection address={address} daoCells={daoCells} />
    </>
  );
}
