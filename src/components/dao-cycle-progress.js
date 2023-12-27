import { Progress } from "flowbite-react";

export const WARNING_THRESHOLD = 98;
export const RECOMMENDING_THRESHOLD = 80;

export default function DaoCycleProgress({ progress, ...props }) {
  const color =
    progress >= WARNING_THRESHOLD
      ? "red"
      : progress >= RECOMMENDING_THRESHOLD
        ? "green"
        : "gray";
  return (
    <Progress
      {...props}
      progress={Math.max(1, progress)}
      color={color}
    ></Progress>
  );
}
