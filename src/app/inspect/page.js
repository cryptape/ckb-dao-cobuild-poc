import { getConfig } from "@/lib/config";

export default function InspectPage() {
  const info = {
    config: getConfig(),
  };

  return <pre>{JSON.stringify(info, null, 2)}</pre>;
}
