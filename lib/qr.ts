import QRCode from "qrcode";

export function qrDataUrl(value: string): Promise<string> {
  return QRCode.toDataURL(value, {
    margin: 1,
    width: 420,
    errorCorrectionLevel: "M",
    color: { dark: "#0a0a0a", light: "#fefcf5" },
  });
}
