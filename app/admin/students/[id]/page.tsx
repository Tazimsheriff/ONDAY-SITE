import Link from "next/link";
import { notFound } from "next/navigation";
import { Flash, btn } from "@/components/ui";
import { saveStudent } from "@/lib/actions";
import { getUserById, listLedger, listTeams } from "@/lib/db";
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

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link className="text-sm font-bold underline" href="/admin/students">All Sapiens</Link>
      <h1 className="mt-3 font-display text-5xl font-extrabold tracking-tight">{user.name}</h1>
      <p className="mt-2 font-mono text-sm">Account on file</p>
      <p className="mt-1 text-sm">{[user.email, user.college, user.year, user.approval_status].filter(Boolean).join(" · ")}</p>
      <div className="mt-4">
        <Flash error={flash.error} notice={flash.notice} />
      </div>

      <form action={saveStudent} className="mt-6 grid gap-3 border-[1.6px] border-ink bg-paper p-5 shadow-[4px_4px_0_#0a0a0a]">
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
          Task
          <textarea name="task" defaultValue={user.task} className="field mt-1 min-h-24 font-medium" />
        </label>
        <label className="text-sm font-bold">
          Secret task
          <textarea name="secretTask" defaultValue={user.secret_task} className="field mt-1 min-h-24 font-medium" />
        </label>
        <button className={btn("ink")} type="submit">Save</button>
      </form>

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
