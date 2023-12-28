"use client";

import { useState } from "react";
import { Alert } from "flowbite-react";

export default function Disclaimer() {
  const [dismissed, setDismissed] = useState(false);

  return dismissed ? null : (
    <Alert className="mb-5" color="warning">
      <h3 className="not-prose font-medium">Disclamer!</h3>
      <p>
        This is a PoC demo to show how to use JoyID and the new witness layout
        and transaction building process named Cobuild.
      </p>
      <p>
        The demo uses a custom lock which has a different CKB address from the
        JoyID CKB address.
      </p>
      <p>The contract used by this demo has not been audited.</p>
      <p>This demo runs in CKB testnet.</p>
    </Alert>
  );
}
