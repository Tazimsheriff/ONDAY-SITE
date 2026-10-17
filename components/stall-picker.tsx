"use client";

import { useState } from "react";
import { saveStallPriorities } from "@/lib/actions";
import type { Stall } from "@/lib/agenda";

export function StallPicker({ stalls, first, second }: { stalls: Stall[]; first: string; second: string }) {
  const [one, setOne] = useState(first);
  const [two, setTwo] = useState(second === first ? "" : second);

  return (
    <form action={saveStallPriorities} className="rounded-[1.1rem] border-[2.5px] border-[#1c1c1c] bg-white p-4">
      <p className="text-xs font-extrabold uppercase tracking-[0.14em]">Your stalls</p>
      <p className="mt-1 text-sm leading-relaxed">Choose a first stall and a second stall. They have to be different.</p>
      <label className="mt-3 block text-sm font-extrabold">
        Priority 1
        <select
          name="stallOne"
          value={one}
          onChange={(event) => {
            const next = event.target.value;
            setOne(next);
            if (next && next === two) setTwo("");
          }}
          className="mt-1 w-full border-[2.5px] border-[#1c1c1c] bg-[#fffdf6] px-3 py-2 text-sm font-bold"
        >
          <option value="">Choose a stall</option>
          {stalls.map((stall) => (
            <option key={stall.id} value={stall.id}>
              {stall.topic} · {stall.name}
            </option>
          ))}
        </select>
      </label>
      <label className="mt-3 block text-sm font-extrabold">
        Priority 2
        <select
          name="stallTwo"
          value={two}
          onChange={(event) => setTwo(event.target.value)}
          className="mt-1 w-full border-[2.5px] border-[#1c1c1c] bg-[#fffdf6] px-3 py-2 text-sm font-bold"
        >
          <option value="">Choose a different stall</option>
          {stalls
            .filter((stall) => stall.id !== one)
            .map((stall) => (
              <option key={stall.id} value={stall.id}>
                {stall.topic} · {stall.name}
              </option>
            ))}
        </select>
      </label>
      <button
        type="submit"
        className="mt-4 border-[2.5px] border-[#1c1c1c] bg-[#ffe34a] px-4 py-2 text-sm font-extrabold shadow-[3px_3px_0_#1c1c1c]"
      >
        Save my stalls
      </button>
    </form>
  );
}
