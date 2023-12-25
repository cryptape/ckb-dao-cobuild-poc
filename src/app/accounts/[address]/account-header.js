export default function AccountHeader({ address }) {
  return (
    <header>
      <p className="break-all">{address}</p>
      <p>
        Claim CKB From{" "}
        <a target="_blank" href="https://faucet.nervos.org/">
          Faucet
        </a>
      </p>
    </header>
  );
}
