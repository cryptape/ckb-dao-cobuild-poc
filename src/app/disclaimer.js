import { Alert } from "flowbite-react";

export default function Disclaimer({ config: { ckbChain } }) {
  return (
    <Alert className="mb-5" color="warning">
      <h3 className="not-prose font-medium">Disclamer!</h3>
      <ul>
        <li>
          This is a PoC demo showcasing the management of DAO deposits through
          the use of a new transaction building protocol named{" "}
          <a
            target="_blank"
            href="https://talk.nervos.org/t/ckb-transaction-cobuild-protocol-overview/7702"
          >
            CoBuild
          </a>
          .
        </li>
        <li>This demo runs in the CKB chain {ckbChain}.</li>
      </ul>
    </Alert>
  );
}
