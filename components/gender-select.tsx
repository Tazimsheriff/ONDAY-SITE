"use client";

import { setGender } from "@/lib/actions";

const OPTIONS = ["Boy", "Girl", "Unclear"] as const;

export function GenderSelect({
  userId,
  gender,
  returnTo,
}: {
  userId: string;
  gender: string;
  returnTo: string;
}) {
  return (
    <form action={setGender} onChange={(event) => event.currentTarget.requestSubmit()}>
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <select name="gender" defaultValue={gender} className="field py-1.5 text-sm" aria-label="Gender">
        <option value="">Not set</option>
        {OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </form>
  );
}
