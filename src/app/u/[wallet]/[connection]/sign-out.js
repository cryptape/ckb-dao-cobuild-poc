"use client";

import { useRouter } from "next/navigation";
import { Dropdown } from "flowbite-react";

export default function SignOut({ walletName, connection }) {
  const router = useRouter();
  return (
    <aside className="not-prose relative flex justify-end">
      <Dropdown inline label={walletName}>
        {connection !== null ? (
          <Dropdown.Header className="break-all">{connection}</Dropdown.Header>
        ) : null}
        <Dropdown.Item onClick={() => router.push("/")}>Sign Out</Dropdown.Item>
      </Dropdown>
    </aside>
  );
}
