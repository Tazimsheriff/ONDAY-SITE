"use client";

import { useMemo, useState } from "react";
import { addPeopleToTeam } from "@/lib/actions";
import { btn } from "@/components/ui";

type Person = {
  id: string;
  name: string;
  college: string;
  gender: string;
  teamId: string | null;
  teamName: string;
};

type TeamOption = {
  id: string;
  name: string;
  members: number;
};

function place(n: number): string {
  const teen = n % 100;
  if (teen >= 11 && teen <= 13) return `${n}th`;
  const last = n % 10;
  if (last === 1) return `${n}st`;
  if (last === 2) return `${n}nd`;
  if (last === 3) return `${n}rd`;
  return `${n}th`;
}

export function TeamPeoplePicker({ people, teams }: { people: Person[]; teams: TeamOption[] }) {
  const [teamId, setTeamId] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const order = useMemo(() => new Map(picked.map((id, index) => [id, index])), [picked]);
  const byId = useMemo(() => new Map(people.map((person) => [person.id, person])), [people]);
  const team = teams.find((item) => item.id === teamId);
  const already = team ? picked.filter((id) => byId.get(id)?.teamId === team.id).length : 0;
  const adding = picked.length - already;
  const after = team ? team.members + adding : 0;

  const rows = [...people].sort((a, b) => {
    const aPick = order.get(a.id);
    const bPick = order.get(b.id);
    if (aPick !== undefined && bPick !== undefined) return aPick - bPick;
    if (aPick !== undefined) return -1;
    if (bPick !== undefined) return 1;
    return 0;
  });

  function toggle(id: string, checked: boolean) {
    setPicked((current) => (checked ? (current.includes(id) ? current : [...current, id]) : current.filter((item) => item !== id)));
  }

  const count =
    picked.length === 0
      ? "Nobody selected yet. Each person you tick is numbered."
      : team
        ? `${picked.length} selected. ${team.name} has ${team.members} now, and will have ${after}.`
        : `${picked.length} selected. Choose a team to see the new size.`;

  return (
    <form action={addPeopleToTeam} className="border-[1.6px] border-ink bg-paper p-4 shadow-[4px_4px_0_#0a0a0a]">
      <h2 className="font-display text-2xl font-extrabold">Add people already here</h2>
      <p className="mt-1 text-sm">Pick a team and tick people in order. The first one you tick is 1st, then 2nd, then 3rd.</p>
      <select name="teamId" required className="field mt-3" value={teamId} onChange={(event) => setTeamId(event.target.value)}>
        <option value="" disabled>
          Choose a team
        </option>
        {teams.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name} · {item.members} now
          </option>
        ))}
      </select>
      <p className="mt-3 border-[1.6px] border-ink bg-yellow px-3 py-2 text-sm font-extrabold">{count}</p>
      <div className="mt-2 max-h-72 overflow-auto border-[1.6px] border-ink bg-cream">
        {rows.length ? (
          rows.map((person) => {
            const pick = order.get(person.id);
            const selected = pick !== undefined;
            const label = selected ? place(pick + 1) : "";
            const onThisTeam = Boolean(team && person.teamId === team.id);
            return (
              <label
                key={person.id}
                className={`flex items-start gap-2 border-b border-ink/15 px-3 py-2 text-sm ${selected ? "bg-yellow" : ""}`}
              >
                <input
                  type="checkbox"
                  name="userId"
                  value={person.id}
                  checked={selected}
                  onChange={(event) => toggle(person.id, event.target.checked)}
                  className="mt-1"
                />
                {selected ? (
                  <span className="grid h-7 w-12 shrink-0 place-items-center border-[1.6px] border-ink bg-white text-xs font-extrabold">
                    {label}
                  </span>
                ) : null}
                <span className="min-w-0">
                  <span className="block font-semibold">
                    {person.name}
                    {selected ? <span className="font-extrabold"> · {label} person selected</span> : null}
                  </span>
                  <span className="block text-xs">
                    {[person.college || "No college", person.gender, onThisTeam ? "Already on this team" : person.teamName || "Unassigned"]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </span>
              </label>
            );
          })
        ) : (
          <p className="px-3 py-3 text-sm">Nobody is on the list yet.</p>
        )}
      </div>
      <button className={`${btn("ink")} mt-3`} type="submit" disabled={picked.length === 0}>
        {picked.length ? `Add ${picked.length} to team` : "Add to team"}
      </button>
    </form>
  );
}
