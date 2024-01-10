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
  processingWallet,
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
      {state.connections.length > 0 && processingWallet !== null ? (
        <Modal show dismissible className="not-prose" onClose={reset}>
          <Modal.Header>
            Choose {walletSelector.walletName(processingWallet)} Account
          </Modal.Header>
          <Modal.Body>
            <ListGroup>
              {state.connections.map((c) => (
                <ListGroup.Item
                  onClick={() => select(processingWallet, c)}
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
        {Object.keys(walletSelector.providers).map((wallet) => (
          <Button
            key={wallet}
            onClick={() => connect(wallet)}
            isProcessing={processingWallet === wallet}
            disabled={processingWallet !== null}
          >
            {walletSelector.walletName(wallet)}
          </Button>
        ))}
      </div>
    </section>
  );
}

export default function Connector() {
  const router = useRouter();
  const [processingWallet, setProcessingWallet] = useState(null);
  const [state, setState] = useState({ connections: [], error: null });

  const reset = (error = null) => {
    setState({ connections: [], error });
    setProcessingWallet(null);
  };

  const select = (wallet, connection) => {
    router.push(`/u/${wallet}/${connection}`);
  };

  const connect = async (wallet) => {
    setProcessingWallet(wallet);
    let connections = [];
    try {
      connections = await walletSelector.connect(wallet);
    } catch (err) {
      console.error(err.stack);
      reset(err.message ?? err.toString());
      return;
    }

    if (connections.length === 1) {
      return select(wallet, connections[0]);
    }

    setState({
      connections,
      error: connections.length > 0 ? undefined : "No accounts selected",
    });
  };

  const childProps = { state, processingWallet, connect, select, reset };
  return <ConnectorView {...childProps} />;
}
