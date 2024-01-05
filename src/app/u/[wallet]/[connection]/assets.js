import Link from "next/link";
import { Button } from "flowbite-react";
import Capacity from "@/components/capacity";
import { fetchAssetsWithCache } from "@/actions/fetch-assets";
import DaoCells from "./dao-cells";
import Loading from "./loading";

export const revalidate = 12;

export function CkbSection({ wallet, connection, address, ckbBalance }) {
  return (
    <section>
      <h2>CKB</h2>
      <p>
        Balance: <Capacity value={ckbBalance} />
      </p>
      <Button
        as={Link}
        href={`/u/${wallet}/${connection}/transfer`}
        className="not-prose"
      >
        Transfer
      </Button>
    </section>
  );
}

export function DaoSection({ wallet, connection, address, daoCells }) {
  return (
    <section>
      <h2>DAO</h2>
      <aside className="mb-5">
        <Button
          as={Link}
          href={`/u/${wallet}/${connection}/deposit`}
          className="not-prose"
        >
          Deposit
        </Button>
      </aside>
      <DaoCells
        wallet={wallet}
        connection={connection}
        address={address}
        daoCells={daoCells}
      />
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

export default async function Assets({ wallet, connection, address }) {
  const { ckbBalance, daoCells } = await fetchAssetsWithCache(address);
  const childProps = { wallet, connection, address };

  return (
    <>
      <CkbSection ckbBalance={ckbBalance} {...childProps} />
      <DaoSection daoCells={daoCells} {...childProps} />
    </>
  );
}
