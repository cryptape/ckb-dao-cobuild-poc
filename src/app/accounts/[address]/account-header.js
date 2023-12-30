export default function AccountHeader({ address, config: { ckbChain } }) {
  return (
    <header>
      <p className="break-all">{address}</p>
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
