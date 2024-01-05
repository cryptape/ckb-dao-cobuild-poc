"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Modal, ListGroup } from "flowbite-react";

import * as walletSelector from "@/lib/wallet/selector";

function getAccountName(connection) {
  if (typeof connection === "string" || connection instanceof String) {
    return connection;
  } else {
    return connection.title;
  }
}

export function ConnectorView({
  state,
  processingWalletSlug,
  connect,
  select,
  reset,
}) {
  return (
    <section>
      {state.error ? (
        <Alert className="block mb-5" color="failure">
          {state.error}
        </Alert>
      ) : null}
      {state.connections.length > 0 && processingWalletSlug !== null ? (
        <Modal show dismissible className="not-prose" onClose={reset}>
          <Modal.Header>
            Choose {walletSelector.walletName(processingWalletSlug)} Account
          </Modal.Header>
          <Modal.Body>
            <ListGroup>
              {state.connections.map((c) => (
                <ListGroup.Item
                  onClick={() => select(processingWalletSlug, c)}
                  key={getAccountName(c)}
                  className="break-all"
                >
                  {getAccountName(c)}
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Modal.Body>
        </Modal>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {Object.keys(walletSelector.providers).map((walletSlug) => (
          <Button
            key={walletSlug}
            onClick={() => connect(walletSlug)}
            isProcessing={processingWalletSlug === walletSlug}
            disabled={processingWalletSlug !== null}
          >
            {walletSelector.walletName(walletSlug)}
          </Button>
        ))}
      </div>
    </section>
  );
}

export default function Connector() {
  const router = useRouter();
  const [processingWalletSlug, setProcessingWalletSlug] = useState(null);
  const [state, setState] = useState({ connections: [], error: null });

  const reset = (error = null) => {
    setState({ connections: [], error });
    setProcessingWalletSlug(null);
  };

  const select = (walletSlug, connection) => {
    router.push(`/u/${walletSlug}/${connection}`);
  };

  const connect = async (walletSlug) => {
    setProcessingWalletSlug(walletSlug);
    let connections = [];
    try {
      connections = await walletSelector.connect(walletSlug);
    } catch (err) {
      console.error(err.stack);
      reset(err.toString());
      return;
    }

    if (connections.length === 1) {
      return select(walletSlug, connections[0]);
    }

    setState({
      connections,
      error: connections.length > 0 ? undefined : "No accounts selected",
    });
  };

  const childProps = { state, processingWalletSlug, connect, select, reset };
  return <ConnectorView {...childProps} />;
}
