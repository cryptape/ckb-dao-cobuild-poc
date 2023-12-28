import { useConfig } from "@/lib/config";

export default function InspectPage() {
  const info = {
    config: useConfig(),
  };

  return <pre>{JSON.stringify(info, null, 2)}</pre>;
}
