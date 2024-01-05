import * as walletSelector from "@/lib/wallet/selector";
import SignOut from "./sign-out";

export default function AccountHeader({
  address,
  wallet,
  connection,
  config: { ckbChain },
}) {
  const walletName = walletSelector.walletName(wallet);

  return (
    <header>
      <SignOut
        walletName={walletName}
        connection={connection !== address ? connection : null}
      />

      <p className="break-all">
        <strong>CKB Address:</strong> {address}
      </p>
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
