import Link from "next/link";
import { redirect } from "next/navigation";
import { QrScanner } from "@/components/qr-scanner";
import { btn } from "@/components/ui";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Scan" };

export default async function ScanPage() {
  const user = await requireUser();
  const admin = user.role === "admin";
  if (!admin && user.role !== "user") redirect("/");

  return (
    <div className="mx-auto max-w-xl px-4 py-8 sm:py-12">
      <p className="text-xs font-bold uppercase tracking-[0.18em]">Class 101</p>
      <h1 className="mt-2 font-display text-5xl font-extrabold tracking-tight">{admin ? "Scan a snack pass." : "Scan a card."}</h1>
      <p className="mt-3 leading-relaxed">
        {admin
          ? "Stay signed in on this phone and point the camera at their snack QR. The first scan marks it bought and you hand over the snack. A second scan says already bought."
          : "Stay signed in and point this at someone else's QR. Their card opens, and they show up on your account. Scanning the same card again doesn't count."}
      </p>
      <div className="mt-6 border-[1.6px] border-ink bg-paper p-4 shadow-[6px_6px_0_#0a0a0a]">
        <QrScanner hint={admin ? "Point the camera at a snack pass." : "Point the camera at their Class 101 QR."} />
      </div>
      <Link className={`${btn("paper")} mt-5`} href={admin ? "/admin" : "/dashboard"}>
        {admin ? "Back to admin" : "Back to my desk"}
      </Link>
    </div>
  );
}
