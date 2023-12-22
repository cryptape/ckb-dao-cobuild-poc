import { fetchAssets } from "@/lib/cobuild/assets-manager";
import AssetsClient from "./assets";
import { BI } from "@ckb-lumos/bi";

export function renderDecimal(number, digits) {
  const integer = number.div(BI.from(10).pow(digits));
  const fraction = number.mod(BI.from(10).pow(digits));
  return `${integer}.${fraction.toString().padStart(digits, "0")}`;
}

export function renderCapacity(number) {
  return renderDecimal(number, 8);
}

export default async function Assets({ config, address }) {
  const assets = await fetchAssets(config, address);
  return (
    <section>
      <h2>CKB</h2>
      <p>{renderCapacity(assets.ckbBalance)}</p>
    </section>
  );
}
