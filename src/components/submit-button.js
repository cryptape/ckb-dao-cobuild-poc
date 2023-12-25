"use client";

import { useFormStatus } from "react-dom";
import { Button } from "flowbite-react";

export default function SubmitButton({ children }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" aria-disabled={pending}>
      {children}
    </Button>
  );
}
