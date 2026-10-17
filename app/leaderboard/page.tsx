import Link from "next/link";
import { Eyebrow } from "@/components/ui";
import { getSessionUser } from "@/lib/auth";
import { leaderboard, listTeamMembers } from "@/lib/db";
import { initials, teamColor } from "@/lib/format";

export const metadata = { title: "Board" };

export default async function LeaderboardPage() {
  const user = await getSessionUser();
  const named = Boolean(user);
  const board = leaderboard();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Eyebrow color="#ffd966">Live board</Eyebrow>
      <h1 className="mt-4 font-display text-5xl font-extrabold tracking-tight sm:text-7xl">Who is ahead.</h1>
      <p className="mt-3 max-w-xl text-lg">
        Teams are ranked by marks: every member&apos;s points, plus any bonus the organizers add. Individuals are ranked by points alone.
      </p>
      {named ? null : (
        <p className="mt-3 max-w-xl text-sm">
          Names stay as initials until you{" "}
          <Link className="font-bold underline" href="/login?next=/leaderboard">
            sign in
          </Link>
          .
        </p>
      )}

      <div className="mt-8 grid min-w-0 gap-4 lg:grid-cols-2">
        <section className="min-w-0">
          <h2 className="font-display text-3xl font-extrabold">Teams</h2>
          <ol className="mt-4 space-y-3">
            {board.teams.map((team) => {
              const members = listTeamMembers(team.id);
              const yours = user?.team_id === team.id;
              return (
                <li
                  key={team.id}
                  className="border-[1.6px] border-ink p-4 shadow-[4px_4px_0_#0a0a0a]"
                  style={{ background: yours ? "#ffd966" : teamColor(team.color) }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-[0.16em]">#{team.rank}{yours ? " · You" : ""}</p>
                      <h3 className="font-display text-3xl font-extrabold leading-none">{team.name}</h3>
                      {team.motto ? <p className="mt-1 text-sm">{team.motto}</p> : null}
                    </div>
                    <p className="text-right">
                      <span className="block font-display text-4xl font-extrabold leading-none">{team.marks}</span>
                      <span className="text-[11px] font-bold uppercase tracking-[0.14em]">marks</span>
                    </p>
                  </div>
                  <p className="mt-3 break-words text-sm">
                    {members.length
                      ? members.map((member) => (named ? member.name : initials(member.name))).join(" · ")
                      : "No one allotted yet."}
                  </p>
                </li>
              );
            })}
          </ol>
        </section>

        <section className="min-w-0">
          <h2 className="font-display text-3xl font-extrabold">Sapiens</h2>
          <ol className="mt-4 border-[1.6px] border-ink bg-paper shadow-[4px_4px_0_#0a0a0a]">
            {board.people.map((person) => {
              const yours = user?.id === person.id;
              return (
                <li key={person.id} className="flex items-center gap-3 border-b-[1.6px] border-ink px-3 py-3 last:border-b-0" style={{ background: yours ? "#ffd966" : undefined }}>
                  <span className="w-8 font-display text-xl font-extrabold">{person.rank}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold">{named ? person.name : initials(person.name)}{yours ? " · You" : ""}</span>
                    <span className="block truncate text-xs">
                      {(named ? [person.team_name || "No team", person.college] : [person.team_name || "No team"]).filter(Boolean).join(" · ")}
                    </span>
                  </span>
                  <span className="font-display text-2xl font-extrabold">{person.points}</span>
                </li>
              );
            })}
          </ol>
        </section>
      </div>
    </div>
  );
}
