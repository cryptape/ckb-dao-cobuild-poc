import SignOut from "./sign-out";

export default function AccountHeader({
  address,
  wallet,
  connection,
  config: { ckbChain, ckbChainConfig },
}) {
  return (
    <header>
      <SignOut
        wallet={wallet}
        connection={connection !== address ? connection : null}
        address={address}
        ckbChainConfig={ckbChainConfig}
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
