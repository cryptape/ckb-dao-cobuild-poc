import { BI, formatUnit } from "@ckb-lumos/bi";

export default function Capacity({ value, ...props }) {
  return <span {...props}>{formatUnit(BI.from(value), "ckb")}</span>;
}
