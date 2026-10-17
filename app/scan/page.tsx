import Link from "next/link";
import { redirect } from "next/navigation";
import { QrScanner } from "@/components/qr-scanner";
import { btn } from "@/components/ui";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Scan" };

export default async function ScanPage() {
  const user = await requireUser();
  if (user.role !== "user") redirect("/admin");

  return (
    <div className="mx-auto max-w-xl px-4 py-8 sm:py-12">
      <p className="text-xs font-bold uppercase tracking-[0.18em]">Class 101</p>
      <h1 className="mt-2 font-display text-5xl font-extrabold tracking-tight">Scan a card.</h1>
      <p className="mt-3 leading-relaxed">
        Stay signed in and point this at someone else&apos;s QR. Their card opens, and they show up on your account. Scanning the same card again doesn&apos;t count.
      </p>
      <div className="mt-6 border-[1.6px] border-ink bg-paper p-4 shadow-[6px_6px_0_#0a0a0a]">
        <QrScanner />
      </div>
      <Link className={`${btn("paper")} mt-5`} href="/dashboard">
        Back to my desk
      </Link>
    </div>
  );
}
