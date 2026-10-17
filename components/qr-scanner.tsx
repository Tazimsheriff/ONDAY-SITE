"use client";

import { useEffect, useRef, useState } from "react";

function slugFromScan(value: string): string | null {
  const text = value.trim();
  let path = text;
  try {
    path = new URL(text).pathname;
  } catch {
    /* a bare path is fine */
  }
  const card = path.match(/\/card\/([^/?#]+)/);
  const pass = path.match(/\/pass\/([^/?#]+)/);
  const match = card || pass;
  if (!match) return null;
  let slug = "";
  try {
    slug = decodeURIComponent(match[1]);
  } catch {
    return null;
  }
  if (!slug || slug.includes("/") || slug.includes("..") || slug.length > 80) return null;
  return `/${card ? "card" : "pass"}/${encodeURIComponent(slug)}`;
}

function openScan(path: string) {
  window.location.assign(path);
}

export function QrScanner({ hint = "Point the camera at their Class 101 QR." }: { hint?: string }) {
  const handled = useRef(false);
  const [message, setMessage] = useState(hint);

  useEffect(() => {
    let cancel = false;
    let scanner: { stop: () => Promise<void> } | null = null;

    (async () => {
      const { Html5Qrcode } = await import("html5-qrcode");
      if (cancel) return;
      const instance = new Html5Qrcode("qr-reader");
      scanner = instance;
      try {
        await instance.start(
          { facingMode: "environment" },
          { fps: 8, qrbox: { width: 220, height: 220 } },
          (decoded) => {
            if (handled.current) return;
            const target = slugFromScan(decoded);
            if (!target) {
              setMessage("That QR isn't a Class 101 card or pass.");
              return;
            }
            handled.current = true;
            openScan(target);
          },
          () => undefined,
        );
      } catch {
        if (!cancel) setMessage("The camera didn't open. Allow camera access, or choose a photo of the QR.");
      }
    })();

    return () => {
      cancel = true;
      scanner?.stop().catch(() => undefined);
    };
  }, []);

  async function onPhoto(file: File | undefined) {
    if (!file || handled.current) return;
    const { Html5Qrcode } = await import("html5-qrcode");
    const instance = new Html5Qrcode("qr-file");
    try {
      const decoded = await instance.scanFile(file, false);
      const target = slugFromScan(decoded);
      if (!target) {
        setMessage("That photo isn't a Class 101 card or pass.");
        return;
      }
      handled.current = true;
      openScan(target);
    } catch {
      setMessage("Couldn't read a QR in that photo.");
    } finally {
      instance.clear();
    }
  }

  return (
    <div>
      <div id="qr-reader" className="overflow-hidden border-[1.6px] border-ink bg-ink" />
      <div id="qr-file" className="hidden" />
      <p className="mt-3 text-sm leading-relaxed">{message}</p>
      <label className="mt-4 block text-sm font-bold">
        Or choose a photo
        <input
          className="field mt-2"
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(event) => onPhoto(event.target.files?.[0])}
        />
      </label>
    </div>
  );
}
