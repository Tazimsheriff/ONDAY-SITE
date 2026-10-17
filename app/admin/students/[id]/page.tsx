import Link from "next/link";
import { notFound } from "next/navigation";
import { Flash, btn } from "@/components/ui";
import { grantGoodie, refundRedemption, refundUserGoodies, saveStudent } from "@/lib/actions";
import { getUserById, listGoodies, listLedger, listRedemptions, listTeams } from "@/lib/db";
import { stallLabel } from "@/lib/agenda";
import { formatPhone } from "@/lib/format";

export const metadata = { title: "Edit Sapien" };

export default async function StudentEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ notice?: string; error?: string }>;
}) {
  const { id } = await params;
  const flash = await searchParams;
  const user = getUserById(id);
  if (!user || user.role !== "user") notFound();
  const teams = listTeams();
  const ledger = listLedger(user.id, 8);
  const goodies = listGoodies(true);
  const held = listRedemptions(user.id).filter((item) => item.status === "claimed" || item.status === "collected");
  const back = `/admin/students/${user.id}`;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link className="text-sm font-bold underline" href="/admin/students">All Sapiens</Link>
      <h1 className="mt-3 font-display text-5xl font-extrabold tracking-tight">{user.name}</h1>
      <p className="mt-2 font-mono text-sm">Login password · {user.phone_key ? formatPhone(user.phone_key) : "No phone on file"}</p>
      <p className="mt-1 text-sm">{[user.email, user.college, user.year, user.approval_status].filter(Boolean).join(" · ")}</p>
      <p className="mt-1 text-sm font-bold">
        Stalls · {user.stall_one ? stallLabel(user.stall_one) : "No first choice"}
        {" · "}
        {user.stall_two ? stallLabel(user.stall_two) : "No second choice"}
      </p>
      <div className="mt-4">
        <Flash error={flash.error} notice={flash.notice} />
      </div>

      <form
        key={[user.dollars, user.points, user.team_id, user.phone, user.college, user.gender, user.task, user.secret_task].join("|")}
        action={saveStudent}
        className="mt-6 grid gap-3 border-[1.6px] border-ink bg-paper p-5 shadow-[4px_4px_0_#0a0a0a]"
      >
        <input type="hidden" name="userId" value={user.id} />
        <label className="text-sm font-bold">
          Team
          <select name="teamId" defaultValue={user.team_id ?? ""} className="field mt-1 font-medium">
            <option value="">Unassigned</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>{team.name}</option>
            ))}
          </select>
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-bold">
            Points
            <input name="points" type="number" min={0} defaultValue={user.points} className="field mt-1 font-medium" />
          </label>
          <label className="text-sm font-bold">
            Sapien Dollars
            <input name="dollars" type="number" min={0} defaultValue={user.dollars} className="field mt-1 font-medium" />
          </label>
        </div>
        <label className="text-sm font-bold">
          Login phone
          <input name="phone" defaultValue={user.phone} className="field mt-1 font-medium" placeholder="10-digit phone, this is their password" />
        </label>
        <label className="text-sm font-bold">
          College
          <input name="college" defaultValue={user.college} className="field mt-1 font-medium" />
        </label>
        <label className="text-sm font-bold">
          Gender
          <select name="gender" defaultValue={user.gender} className="field mt-1 font-medium">
            <option value="">Not set</option>
            <option value="Boy">Boy</option>
            <option value="Girl">Girl</option>
            <option value="Unclear">Unclear</option>
          </select>
        </label>
        <label className="text-sm font-bold">
          Task
          <textarea name="task" defaultValue={user.task} className="field mt-1 min-h-24 font-medium" />
        </label>
        <label className="text-sm font-bold">
          Secret task
          <textarea name="secretTask" defaultValue={user.secret_task} className="field mt-1 min-h-24 font-medium" />
        </label>
        <button className={btn("ink")} type="submit">Save</button>
      </form>

      <section className="mt-6 border-[1.6px] border-ink bg-paper p-5 shadow-[4px_4px_0_#0a0a0a]">
        <h2 className="font-display text-2xl font-extrabold">Goodies</h2>
        <p className="mt-1 text-sm">Give one back only before the counter scans it. A bought pass stays bought. Set their dollars in the form above.</p>
        {held.length ? (
          <ul className="mt-4 divide-y-[1.6px] divide-ink border-[1.6px] border-ink">
            {held.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 px-3 py-3 text-sm">
                <span>
                  <span className="font-bold">{item.quantity > 1 ? `${item.quantity}× ` : "1× "}{item.goodie_name}</span>
                  {" · "}S${item.cost * (item.quantity || 1)}
                  {" · "}{item.status === "collected" ? "Bought" : "Not scanned yet"}
                </span>
                {item.status === "claimed" ? (
                  <form action={refundRedemption}>
                    <input type="hidden" name="redemptionId" value={item.id} />
                    <input type="hidden" name="returnTo" value={back} />
                    <button className={btn("paper", "px-3 py-1.5")} type="submit">Give back</button>
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm">No goodies on this person.</p>
        )}
        {held.some((item) => item.status === "claimed") ? (
          <form action={refundUserGoodies} className="mt-3">
            <input type="hidden" name="userId" value={user.id} />
            <button className={btn("yellow")} type="submit">Give back everything not scanned yet</button>
          </form>
        ) : null}
        <form action={grantGoodie} className="mt-4 flex flex-wrap items-end gap-2">
          <input type="hidden" name="userId" value={user.id} />
          <label className="min-w-52 flex-1 text-sm font-bold">
            Add a goodie
            <select name="goodieId" className="field mt-1 font-medium" required defaultValue="">
              <option value="" disabled>Choose one</option>
              {goodies.map((goodie) => (
                <option key={goodie.id} value={goodie.id}>
                  {goodie.name} · {goodie.cost === 0 ? "Free" : `S$${goodie.cost}`} · {goodie.stock} left
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-bold">
            How many
            <input name="quantity" type="number" min={1} max={100} defaultValue={1} className="field mt-1 w-20 font-medium" />
          </label>
          <button className={btn("ink")} type="submit">Give this goodie</button>
        </form>
      </section>

      <section className="mt-6">
        <h2 className="font-display text-2xl font-extrabold">History</h2>
        <ul className="mt-2 divide-y divide-ink/15 border-[1.6px] border-ink bg-cream px-4 text-sm">
          {ledger.length ? (
            ledger.map((entry) => (
              <li key={entry.id} className="py-2">{entry.note}</li>
            ))
          ) : (
            <li className="py-2">No adjustments yet.</li>
          )}
        </ul>
      </section>
    </div>
  );
}
