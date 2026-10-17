import QRCode from "qrcode";

const cache = new Map<string, string>();

export async function qrDataUrl(value: string): Promise<string> {
  const hit = cache.get(value);
  if (hit) return hit;
  const svg = await QRCode.toString(value, {
    type: "svg",
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#0a0a0a", light: "#fefcf5" },
  });
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  cache.set(value, url);
  return url;
}
