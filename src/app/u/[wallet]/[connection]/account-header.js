import * as walletSelector from "@/lib/wallet/selector";

export default function AccountHeader({
  address,
  walletSlug,
  connection,
  config: { ckbChain },
}) {
  const walletName = walletSelector.walletName(walletSlug);

  return (
    <header>
      <p className="break-all">
        <strong>CKB Address:</strong> {address}
      </p>
      {address !== connection ? (
        <p className="break-all">
          <strong>{walletName} Address:</strong> {connection}
        </p>
      ) : null}
      {ckbChain === "AGGRON4" ? (
        <p>
          Claim CKB From{" "}
          <a target="_blank" href="https://faucet.nervos.org/">
            Faucet
          </a>
        </p>
      ) : null}
    </header>
  );
}
