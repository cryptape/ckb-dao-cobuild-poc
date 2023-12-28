import { Alert } from "flowbite-react";

export default function Disclaimer({ config: { ckbChain } }) {
  return (
    <Alert className="mb-5" color="warning">
      <h3 className="not-prose font-medium">Disclamer!</h3>
      <ul>
        <li>
          This is a PoC demo showcasing the management of DAO deposits through
          the use of a new witness layout and transaction building protocol
          named <strong>Cobuild</strong>.
        </li>
        <li>
          In this demo, JoyID is used to sign transactions. Please note that the
          CKB address used in this demo is different from the official JoyID CKB
          address, as a custom lock is employed to support the Cobuild witness
          layout.
        </li>
        <li>The custom lock utilized in this demo has never been audited!</li>
        <li>This demo runs in the CKB chain {ckbChain}.</li>
      </ul>
    </Alert>
  );
}
