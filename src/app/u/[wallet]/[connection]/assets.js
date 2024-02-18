import { BI, formatUnit } from "@ckb-lumos/bi";
import { Button } from "flowbite-react";
import Link from "next/link";

import { fetchAssetsWithCache } from "@/actions/fetch-assets";
import Capacity from "@/components/capacity";
import PackingVerifierHelpText from "@/components/packing-verifier-help-text";
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

export function VerifierCells({ wallet, connection, verifierCells }) {
  let lockedCapacity = BI.from(0);
  for (const cell of verifierCells) {
    lockedCapacity = lockedCapacity.add(BI.from(cell.cellOutput.capacity));
  }
  return (
    <>
      <h3>Verifier Cells</h3>
      <PackingVerifierHelpText />
      <p>
        You have {formatUnit(lockedCapacity, "ckb")} CKB locked in DAO action
        verifier cells. You can reclaim them by destroy the verifier cells.
      </p>
      <Button
        as={Link}
        href={`/u/${wallet}/${connection}/reclaim`}
        color="light"
        className="not-prose inline-block"
      >
        Reclaim
      </Button>
    </>
  );
}

export function DaoSection({
  wallet,
  connection,
  address,
  daoCells,
  verifierCells,
}) {
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
      {verifierCells.length > 0 ? (
        <VerifierCells
          wallet={wallet}
          connection={connection}
          verifierCells={verifierCells}
        />
      ) : null}
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
  const { ckbBalance, daoCells, verifierCells } =
    await fetchAssetsWithCache(address);
  const childProps = { wallet, connection, address };

  return (
    <>
      <CkbSection ckbBalance={ckbBalance} {...childProps} />
      <DaoSection
        daoCells={daoCells}
        verifierCells={verifierCells}
        {...childProps}
      />
    </>
  );
}
