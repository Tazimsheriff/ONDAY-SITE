import { Flash, btn } from "@/components/ui";
import { adjustTeamPoints, deleteTeam, saveTeam } from "@/lib/actions";
import { listTeamMembers, listTeams } from "@/lib/db";
import { TEAM_COLORS, teamColor } from "@/lib/format";

export const metadata = { title: "Teams" };

export default async function TeamsPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; error?: string }>;
}) {
  const flash = await searchParams;
  const teams = listTeams();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-display text-5xl font-extrabold tracking-tight">Teams</h1>
      <p className="mt-2 max-w-xl">
        Create a team here, then allot people from the Sapiens list. Team points move the board on their own. Member points are added on top.
      </p>
      <div className="mt-4">
        <Flash error={flash.error} notice={flash.notice} />
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
              <p className="text-sm">{members.length ? members.map((member) => `${member.name} (${member.points})`).join(" · ") : "Empty team."}</p>
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
