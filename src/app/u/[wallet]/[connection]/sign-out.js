"use client";

import * as walletSelector from "@/lib/wallet/selector";
import { Dropdown } from "flowbite-react";
import { useRouter } from "next/navigation";
import * as lumosHelpers from "@ckb-lumos/helpers";

export function LockScriptName({ lockScriptName, address, ckbChainConfig }) {
  if (
    ckbChainConfig.EXPLORER_URL !== null &&
    ckbChainConfig.EXPLORER_URL !== undefined
  ) {
    const script = lumosHelpers.addressToScript(address, {
      config: ckbChainConfig,
    });
    const href = `${ckbChainConfig.EXPLORER_URL}/script/${script.codeHash}/${script.hashType}`;
    return (
      <a
        className="inline-flex items-center font-medium text-blue-600 hover:underline"
        href={href}
        rel="noopener noreferrer"
        target="_blank"
      >
        {lockScriptName}
        <svg
          class="w-4 h-4 ms-2 rtl:rotate-180"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 14 10"
        >
          <path
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M1 5h12m0 0L9 1m4 4L9 9"
          />
        </svg>
      </a>
    );
  }
  return <span>{lockScriptName}</span>;
}

export default function SignOut({
  wallet,
  connection,
  address,
  ckbChainConfig,
}) {
  const walletName = walletSelector.walletName(wallet);
  const lockScriptNameProps = {
    lockScriptName: walletSelector.lockScriptName(wallet),
    address,
    ckbChainConfig,
  };

  const router = useRouter();
  return (
    <aside className="not-prose relative flex justify-end">
      <Dropdown inline label={walletName}>
        <Dropdown.Header className="break-all flex flex-col gap-2">
          {connection !== null ? <p>{connection}</p> : null}
          <p>
            Via <LockScriptName {...lockScriptNameProps} />
          </p>
        </Dropdown.Header>
        <Dropdown.Item onClick={() => router.push("/")}>Sign Out</Dropdown.Item>
      </Dropdown>
    </aside>
  );
}
