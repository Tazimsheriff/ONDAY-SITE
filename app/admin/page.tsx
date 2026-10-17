import Link from "next/link";
import { Card } from "@/components/ui";
import { eventStats, listLedger, listRedemptions } from "@/lib/db";

export const metadata = { title: "Admin" };

export default function AdminPage() {
  const stats = eventStats();
  const ledger = listLedger(undefined, 10);
  const redemptions = listRedemptions().slice(0, 6);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <p className="text-xs font-bold uppercase tracking-[0.18em]">Organizer</p>
      <h1 className="mt-2 font-display text-5xl font-extrabold tracking-tight">Run the room.</h1>
      <p className="mt-3 max-w-2xl text-lg">
        Every Sapien logs in with their name and their phone number. Allot teams here, hand out points, and mint Sapien Dollars.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Sapiens" value={String(stats.students)} href="/admin/students" color="#e3b6ff" />
        <Stat label="Unassigned" value={String(stats.unassigned)} href="/admin/students?team=none" color="#ffc0b6" />
        <Stat label="Points out" value={String(stats.points)} href="/leaderboard" color="#ffd966" />
        <Stat label="Dollars out" value={`S$${stats.dollars}`} href="/admin/goodies" color="#b6eaff" />
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="font-display text-2xl font-extrabold">Latest changes</h2>
          <ul className="mt-3 divide-y divide-ink/15 text-sm">
            {ledger.length ? (
              ledger.map((entry) => (
                <li key={entry.id} className="py-2">
                  <span className="font-bold">{entry.user_name || "Group"}</span>
                  <span> — {entry.note}</span>
                </li>
              ))
            ) : (
              <li className="py-2">No points or dollars moved yet.</li>
            )}
          </ul>
        </Card>
        <Card>
          <h2 className="font-display text-2xl font-extrabold">Latest redemptions</h2>
          <ul className="mt-3 divide-y divide-ink/15 text-sm">
            {redemptions.length ? (
              redemptions.map((item) => (
                <li key={item.id} className="flex justify-between gap-3 py-2">
                  <span>
                    <span className="font-bold">{item.user_name}</span> · {item.quantity > 1 ? `${item.quantity}× ` : ""}{item.goodie_name}
                  </span>
                  <span>{item.status === "refunded" ? "Refunded" : `S$${item.cost * (item.quantity || 1)}`}</span>
                </li>
              ))
            ) : (
              <li className="py-2">Nobody has spent dollars yet.</li>
            )}
          </ul>
        </Card>
      </div>

      <div className="mt-6 flex flex-wrap gap-3 text-sm font-bold">
        <Link className="underline" href="/admin/students">Award points</Link>
        <Link className="underline" href="/admin/teams">Allot teams</Link>
        <Link className="underline" href="/admin/goodies">Edit goodies</Link>
      </div>
    </div>
  );
}

function Stat({ label, value, href, color }: { label: string; value: string; href: string; color: string }) {
  return (
    <Link href={href} className="block border-[1.6px] border-ink p-4 shadow-[4px_4px_0_#0a0a0a]" style={{ background: color }}>
      <p className="text-[11px] font-bold uppercase tracking-[0.14em]">{label}</p>
      <p className="mt-1 font-display text-4xl font-extrabold leading-none">{value}</p>
    </Link>
  );
}
