import { TeamPeoplePicker } from "@/components/team-people-picker";
import { Flash, btn } from "@/components/ui";
import { adjustTeamPoints, assignTeamsFromCsv, deleteTeam, removeFromTeam, saveTeam } from "@/lib/actions";
import { listStudents, listTeamMembers, listTeams } from "@/lib/db";
import { TEAM_COLORS, teamColor } from "@/lib/format";

export const metadata = { title: "Teams" };

export default async function TeamsPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; error?: string; added?: string; skipped?: string }>;
}) {
  const flash = await searchParams;
  const teams = listTeams();
  const students = listStudents().sort((a, b) => {
    const college = (a.college || "\uffff").localeCompare(b.college || "\uffff");
    if (college) return college;
    return a.name.localeCompare(b.name);
  });
  const added = Number.parseInt(flash.added || "", 10);
  const skipped = Number.parseInt(flash.skipped || "", 10);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-display text-5xl font-extrabold tracking-tight">Teams</h1>
      <p className="mt-2 max-w-xl">
        Create a team here, then add people who are already on the list or upload a CSV. Team points move the board on their own. Member points are added on top.
      </p>
      <div className="mt-4">
        <Flash error={flash.error} notice={flash.notice === "roster" ? undefined : flash.notice} />
        {flash.notice === "roster" && Number.isFinite(added) ? (
          <p className="border-[1.6px] border-ink bg-mintcard px-4 py-3 text-sm font-semibold shadow-[3px_3px_0_#0a0a0a]">
            Put {added} {added === 1 ? "person" : "people"} on a team.
            {Number.isFinite(skipped) && skipped > 0 ? ` Skipped ${skipped} that didn't match a person or a team.` : ""}
          </p>
        ) : null}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <TeamPeoplePicker
          people={students.map((student) => ({
            id: student.id,
            name: student.name,
            college: student.college,
            gender: student.gender,
            teamId: student.team_id,
            teamName: student.team_name || "",
          }))}
          teams={teams.map((team) => ({
            id: team.id,
            name: team.name,
            members: Number(team.members ?? 0),
          }))}
        />

        <form action={assignTeamsFromCsv} className="border-[1.6px] border-ink bg-lilac p-4 shadow-[4px_4px_0_#0a0a0a]">
          <h2 className="font-display text-2xl font-extrabold">Upload a CSV</h2>
          <p className="mt-1 text-sm">
            The first row needs <span className="font-bold">name</span> and <span className="font-bold">team</span>. Add <span className="font-bold">phone</span> when two people share a name, and <span className="font-bold">gender</span> if you have it. The team must already exist.
          </p>
          <pre className="mt-3 overflow-x-auto border-[1.6px] border-ink bg-paper px-3 py-2 text-xs">{`name,phone,team
A Student,9000000001,Explore`}</pre>
          <input name="file" type="file" accept=".csv,text/csv" required className="mt-3 block w-full text-sm" />
          <button className={`${btn("ink")} mt-3`} type="submit">
            Assign from CSV
          </button>
        </form>
      </div>

      <form action={saveTeam} className="mt-6 grid gap-2 border-[1.6px] border-ink bg-yellow p-4 shadow-[4px_4px_0_#0a0a0a] md:grid-cols-[1fr_1.4fr_auto_auto]">
        <input name="name" required placeholder="New team name" className="field" />
        <input name="motto" placeholder="Short motto" className="field" />
        <ColorSelect />
        <button className={btn("ink")} type="submit">Create team</button>
      </form>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {teams.map((team) => {
          const members = listTeamMembers(team.id);
          return (
            <form key={team.id} action={saveTeam} className="border-[1.6px] border-ink p-4 shadow-[4px_4px_0_#0a0a0a]" style={{ background: teamColor(team.color) }}>
              <input type="hidden" name="teamId" value={team.id} />
              <div className="flex items-start justify-between gap-3">
                <input name="name" defaultValue={team.name} className="field font-display text-2xl font-extrabold" />
                <p className="text-right">
                  <span className="block font-display text-4xl font-extrabold leading-none">{team.marks}</span>
                  <span className="text-[11px] font-bold uppercase tracking-[0.12em]">marks</span>
                </p>
              </div>
              <input name="motto" defaultValue={team.motto} className="field mt-2" />
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <ColorSelect defaultValue={team.color} />
                <button className={btn("paper")} type="submit">Save team</button>
              </div>
              <div className="mt-4 border-[1.6px] border-ink bg-paper p-3">
                <p className="text-xs font-bold uppercase tracking-[0.14em]">Team points</p>
                <p className="font-display text-3xl font-extrabold leading-none">{team.bonus_points}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {[10, 5, 1, -1, -5, -10].map((delta) => (
                    <button
                      key={delta}
                      className="min-h-10 min-w-10 border-[1.6px] border-ink bg-cream px-2.5 py-1.5 text-sm font-bold shadow-[2px_2px_0_#0a0a0a]"
                      formAction={adjustTeamPoints.bind(null, team.id, delta)}
                      type="submit"
                    >
                      {delta > 0 ? `+${delta}` : delta}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs">
                  Members add {team.member_points ?? 0}. Board total {team.marks}.
                </p>
              </div>
              <p className="mt-3 text-sm font-semibold">{members.length} members</p>
              {members.length ? (
                <ul className="mt-1 text-sm">
                  {members.map((member) => (
                    <li key={member.id} className="mt-1 flex items-start justify-between gap-2">
                      <span>
                        <span className="font-semibold">{member.name}</span>
                        <span className="text-xs">
                          {" "}
                          {[member.college || "No college", member.gender].filter(Boolean).join(" · ")} · {member.points} pts
                        </span>
                      </span>
                      <button
                        className="shrink-0 text-xs font-bold underline"
                        formAction={removeFromTeam.bind(null, member.id)}
                        type="submit"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm">Empty team.</p>
              )}
              <button className="mt-3 text-xs font-bold underline" formAction={deleteTeam} type="submit">
                Delete team
              </button>
            </form>
          );
        })}
      </div>
    </div>
  );
}

function ColorSelect({ defaultValue = "butter" }: { defaultValue?: string }) {
  return (
    <select name="color" defaultValue={defaultValue} className="field" aria-label="Color">
      {Object.keys(TEAM_COLORS).map((color) => (
        <option key={color} value={color}>
          {color}
        </option>
      ))}
    </select>
  );
}
