"use client";

import { Button } from "flowbite-react";

export default function SignForm({ address, buildingPacket }) {
  return (
    <>
      <Button>Sign</Button>
      <pre>{JSON.stringify(buildingPacket, null, 2)}</pre>
    </>
  );
}
