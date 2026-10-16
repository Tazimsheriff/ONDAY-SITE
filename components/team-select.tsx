"use client";

import { assignTeam } from "@/lib/actions";

export function TeamSelect({
  userId,
  teamId,
  teams,
  returnTo,
}: {
  userId: string;
  teamId: string | null;
  teams: { id: string; name: string }[];
  returnTo: string;
}) {
  return (
    <form action={assignTeam} onChange={(event) => event.currentTarget.requestSubmit()}>
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <select name="teamId" defaultValue={teamId ?? ""} className="field py-1.5 text-sm" aria-label="Team">
        <option value="">Unassigned</option>
        {teams.map((team) => (
          <option key={team.id} value={team.id}>
            {team.name}
          </option>
        ))}
      </select>
    </form>
  );
}
