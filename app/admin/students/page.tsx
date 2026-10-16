import Link from "next/link";
import { Flash, btn } from "@/components/ui";
import { TeamSelect } from "@/components/team-select";
import { addScore, bulkApply, createWalkIn, saveSecretTask } from "@/lib/actions";
import { listStudents, listTeams } from "@/lib/db";
import { formatPhone } from "@/lib/format";

export const metadata = { title: "Sapiens" };

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; team?: string; error?: string; notice?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q || "").trim().toLowerCase();
  const teamFilter = sp.team || "";
  const teams = listTeams().map((team) => ({
    id: String(team.id),
    name: String(team.name),
    motto: String(team.motto ?? ""),
    color: String(team.color),
    bonus_points: Number(team.bonus_points),
    created_at: String(team.created_at),
    members: Number(team.members ?? 0),
    marks: Number(team.marks ?? 0),
  }));
  const returnTo = queryPath("/admin/students", sp);

  let students = listStudents();
  if (teamFilter === "none") students = students.filter((student) => !student.team_id);
  else if (teamFilter) students = students.filter((student) => student.team_id === teamFilter);
  if (q) {
    students = students.filter((student) =>
      `${student.name} ${student.college} ${student.phone} ${student.email} ${student.year}`.toLowerCase().includes(q),
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-5xl font-extrabold tracking-tight">Every login.</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed">
            Password is the phone number. Team changes save the moment you pick one. Points rank the board. Sapien Dollars are spent on goodies.
          </p>
        </div>
        <p className="border-[1.6px] border-ink bg-yellow px-3 py-2 text-sm font-bold shadow-[3px_3px_0_#0a0a0a]">
          {students.length} showing
        </p>
      </div>

      <div className="mt-4">
        <Flash error={sp.error} notice={sp.notice} />
      </div>

      <form className="mt-4 flex flex-wrap gap-2" action="/admin/students">
        <input name="q" defaultValue={sp.q || ""} placeholder="Search name, college, phone" className="field max-w-md" />
        {teamFilter ? <input type="hidden" name="team" value={teamFilter} /> : null}
        <button className={btn("ink")} type="submit">Search</button>
      </form>

      <div className="mt-3 flex flex-wrap gap-2">
        <Filter href="/admin/students" active={!teamFilter}>All</Filter>
        <Filter href="/admin/students?team=none" active={teamFilter === "none"}>Unassigned</Filter>
        {teams.map((team) => (
          <Filter key={team.id} href={`/admin/students?team=${team.id}`} active={teamFilter === team.id}>
            {team.name}
          </Filter>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <form action={bulkApply} className="border-[1.6px] border-ink bg-paper p-4 shadow-[4px_4px_0_#0a0a0a]">
          <h2 className="font-display text-2xl font-extrabold">Apply to a group</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <select name="scope" className="field" defaultValue={teamFilter && teamFilter !== "none" ? teamFilter : teamFilter === "none" ? "unassigned" : "all"}>
              <option value="all">All Sapiens</option>
              <option value="unassigned">Unassigned</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
            <select name="kind" className="field">
              <option value="task">Set task</option>
              <option value="secret">Set secret task</option>
              <option value="points">Add points</option>
              <option value="dollars">Add Sapien Dollars</option>
            </select>
          </div>
          <textarea name="text" className="field mt-2 min-h-20" placeholder="Task text. Leave blank if you're adding points or dollars." />
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <input name="amount" type="number" className="field max-w-32" placeholder="Amount" />
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" name="overwrite" />
              Overwrite tasks
            </label>
            <button className={btn("yellow")} type="submit">Apply</button>
          </div>
        </form>

        <form action={createWalkIn} className="border-[1.6px] border-ink bg-lilac p-4 shadow-[4px_4px_0_#0a0a0a]">
          <h2 className="font-display text-2xl font-extrabold">Walk-in</h2>
          <p className="mt-1 text-sm">Someone who wasn&apos;t on the Luma sheet. Their password is the phone you type.</p>
          <input name="name" required className="field mt-3" placeholder="Full name" />
          <input name="phone" required className="field mt-2" placeholder="Phone number" />
          <input name="college" className="field mt-2" placeholder="College" />
          <button className={`${btn("ink")} mt-3`} type="submit">Add them</button>
        </form>
      </div>

      <div className="mt-6 overflow-x-auto border-[1.6px] border-ink bg-paper shadow-[4px_4px_0_#0a0a0a]">
        <table className="w-full min-w-[860px] border-collapse text-left text-sm">
          <thead className="bg-yellow text-xs uppercase tracking-[0.12em]">
            <tr>
              <th className="px-3 py-2 font-bold">Sapien</th>
              <th className="px-3 py-2 font-bold">Password</th>
              <th className="px-3 py-2 font-bold">Team</th>
              <th className="px-3 py-2 font-bold">Points</th>
              <th className="px-3 py-2 font-bold">Dollars</th>
              <th className="px-3 py-2 font-bold">Secret task</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.id} className="border-t-[1.6px] border-ink align-top">
                <td className="px-3 py-3">
                  <Link className="font-bold underline-offset-2 hover:underline" href={`/admin/students/${student.id}`}>
                    {student.name}
                  </Link>
                  <p className="mt-1 max-w-[220px] text-xs">{[student.college, student.year].filter(Boolean).join(" · ")}</p>
                  <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.12em]">{statusLabel(student.approval_status)}</p>
                </td>
                <td className="px-3 py-3 font-mono text-xs">{student.phone_key ? formatPhone(student.phone_key) : "No phone"}</td>
                <td className="px-3 py-3">
                  <TeamSelect userId={student.id} teamId={student.team_id} teams={teams} returnTo={returnTo} />
                </td>
                <td className="px-3 py-3">
                  <p className="font-display text-2xl font-extrabold leading-none">{student.points}</p>
                  <Score userId={student.id} kind="points" returnTo={returnTo} steps={[1, 5, 10]} minus={[-1, -5]} />
                </td>
                <td className="px-3 py-3">
                  <p className="font-display text-2xl font-extrabold leading-none">S${student.dollars}</p>
                  <Score userId={student.id} kind="dollars" returnTo={returnTo} steps={[10, 20, 50]} minus={[-10]} />
                </td>
                <td className="min-w-[220px] px-3 py-3 text-xs">
                  <form action={saveSecretTask} className="grid gap-1">
                    <input type="hidden" name="userId" value={student.id} />
                    <input type="hidden" name="returnTo" value={returnTo} />
                    <textarea
                      name="secretTask"
                      defaultValue={student.secret_task}
                      rows={2}
                      placeholder="Secret task"
                      className="field py-1 text-xs font-medium"
                    />
                    <button className="border-[1.6px] border-ink bg-lilac px-2 py-1 text-xs font-bold shadow-[2px_2px_0_#0a0a0a]" type="submit">
                      Save secret
                    </button>
                  </form>
                  <p className="mt-2">{student.task ? "Public task is set" : "No public task"}</p>
                  <Link className="mt-1 inline-block font-bold underline" href={`/admin/students/${student.id}`}>Edit everything</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Score({
  userId,
  kind,
  returnTo,
  steps,
  minus,
}: {
  userId: string;
  kind: "points" | "dollars";
  returnTo: string;
  steps: number[];
  minus: number[];
}) {
  return (
    <div className="mt-2 flex flex-wrap gap-1">
      {[...steps, ...minus].map((delta) => (
        <form key={delta} action={addScore}>
          <input type="hidden" name="userId" value={userId} />
          <input type="hidden" name="kind" value={kind} />
          <input type="hidden" name="delta" value={delta} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <button className="border-[1.6px] border-ink bg-cream px-1.5 py-0.5 text-xs font-bold shadow-[2px_2px_0_#0a0a0a]" type="submit">
            {delta > 0 ? `+${delta}` : delta}
          </button>
        </form>
      ))}
    </div>
  );
}

function Filter({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="border-[1.6px] border-ink px-2.5 py-1 text-xs font-bold"
      style={{ background: active ? "#0a0a0a" : "#fefcf5", color: active ? "#feeec3" : "#0a0a0a" }}
    >
      {children}
    </Link>
  );
}

function statusLabel(status: string): string {
  if (status === "approved") return "Approved";
  if (status === "pending_approval") return "Pending";
  if (status === "declined") return "Declined";
  if (status === "walk-in") return "Walk-in";
  if (status === "signed-up") return "Signed up";
  if (status === "demo") return "Demo";
  if (status === "invited") return "Invited";
  return status || "Registered";
}

function queryPath(path: string, sp: { q?: string; team?: string }): string {
  const params = new URLSearchParams();
  if (sp.q) params.set("q", sp.q);
  if (sp.team) params.set("team", sp.team);
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}
