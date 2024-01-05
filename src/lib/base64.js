import base64 from "base64-js";

export function urlSafeBase64Decode(str) {
  const remainder = str.length % 4;
  if (remainder !== 0) {
    str = str + "=".repeat(4 - remainder);
  }
  return base64.toByteArray(str);
}
