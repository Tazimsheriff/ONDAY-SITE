import Link from "next/link";
import { redirect } from "next/navigation";
import { QrScanner } from "@/components/qr-scanner";
import { btn } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { listScannedPeople } from "@/lib/db";

export const metadata = { title: "Scan" };

export default async function ScanPage() {
  const user = await requireUser();
  const admin = user.role === "admin";
  if (!admin && user.role !== "user") redirect("/");
  const scanned = admin ? listScannedPeople() : [];
  const scannedPasses = scanned.reduce((total, person) => total + Number(person.count), 0);

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
      {admin ? (
        <section className="mt-8">
          <h2 className="font-display text-3xl font-extrabold">Already scanned</h2>
          <p className="mt-2 text-sm font-bold">
            {scanned.length} {scanned.length === 1 ? "person" : "people"}
            {scannedPasses > scanned.length ? ` · ${scannedPasses} passes` : ""}
          </p>
          {scanned.length ? (
            <ul className="mt-3 divide-y-[1.6px] divide-ink border-[1.6px] border-ink bg-paper shadow-[4px_4px_0_#0a0a0a]">
              {scanned.map((person) => (
                <li key={person.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <span className="font-bold">{person.name}</span>
                  <span>{Number(person.count) > 1 ? Number(person.count) : "1"}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm">Nobody has been scanned yet.</p>
          )}
        </section>
      ) : null}
      <Link className={`${btn("paper")} mt-5`} href={admin ? "/admin" : "/dashboard"}>
        {admin ? "Back to admin" : "Back to my desk"}
      </Link>
    </div>
  );
}
