"use client";

import { useState } from "react";
import { saveStallPriorities } from "@/lib/actions";
import type { AgendaMentor } from "@/lib/agenda";

export function StallPicker({
  mentors,
  first,
  second,
  confirmed,
}: {
  mentors: AgendaMentor[];
  first: string;
  second: string;
  confirmed: boolean;
}) {
  const [one, setOne] = useState(first);
  const [two, setTwo] = useState(second === first ? "" : second);

  function pick(id: string) {
    if (confirmed) return;
    if (id === one) {
      setOne(two);
      setTwo("");
      return;
    }
    if (id === two) {
      setTwo("");
      return;
    }
    if (!one) setOne(id);
    else setTwo(id);
  }

  if (confirmed) {
    return (
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[0.14em]">Your stalls</p>
        <p className="mt-1 text-sm font-extrabold leading-relaxed">Confirmed. You can't change this.</p>
        <MentorRail mentors={mentors} one={first} two={second} />
      </div>
    );
  }

  return (
    <form action={saveStallPriorities}>
      <input type="hidden" name="stallOne" value={one} />
      <input type="hidden" name="stallTwo" value={two} />
      <p className="text-xs font-extrabold uppercase tracking-[0.14em]">Your stalls</p>
      <p className="mt-1 text-sm leading-relaxed">
        Tap one for 1st and another for 2nd. Confirm locks it. You can't change it after that. On a phone, two show at once and the next one peeks in.
      </p>
      <MentorRail mentors={mentors} one={one} two={two} onPick={pick} />
      <button
        type="submit"
        disabled={!one || !two}
        className="mt-4 border-[2.5px] border-[#1c1c1c] bg-[#ffe34a] px-4 py-2 text-sm font-extrabold shadow-[3px_3px_0_#1c1c1c] disabled:cursor-not-allowed disabled:opacity-40"
      >
        Confirm selection
      </button>
    </form>
  );
}

export function MentorRail({
  mentors,
  one = "",
  two = "",
  onPick,
}: {
  mentors: AgendaMentor[];
  one?: string;
  two?: string;
  onPick?: (id: string) => void;
}) {
  return (
    <div className="mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-2">
      {mentors.map((mentor) => {
        const rank = mentor.id === one ? "1st" : mentor.id === two ? "2nd" : "";
        const topic = mentor.topics[0] || "";
        const body = (
          <>
            <div className="relative">
              {mentor.photo ? (
                <img src={mentor.photo} alt="" className="h-36 w-full bg-[#ffe34a] object-cover object-top sm:h-44" />
              ) : (
                <div className="h-36 bg-[#ffe34a] sm:h-44" />
              )}
              {rank ? (
                <span className="absolute top-2 right-2 border-[2px] border-[#1c1c1c] bg-[#ffe34a] px-1.5 py-0.5 text-[11px] font-extrabold">{rank}</span>
              ) : null}
            </div>
            <div className="p-2.5">
              <p className="text-[11px] font-extrabold uppercase leading-tight tracking-[0.08em]">{topic}</p>
              <h3 className="mt-1 font-display text-base font-extrabold leading-tight">{mentor.name}</h3>
              {mentor.role ? <p className="mt-1.5 line-clamp-2 text-[11px] font-bold leading-snug">{mentor.role}</p> : null}
              <p className="mt-1.5 line-clamp-4 text-[11px] leading-relaxed">{mentor.about}</p>
            </div>
          </>
        );
        const frame = `w-[8.25rem] shrink-0 snap-start overflow-hidden rounded-[1.1rem] border-[2.5px] border-[#1c1c1c] bg-white text-left sm:w-40 ${
          rank ? "shadow-[4px_4px_0_#1c1c1c]" : ""
        }`;
        if (!onPick) {
          return (
            <article key={mentor.id} className={frame}>
              {body}
            </article>
          );
        }
        return (
          <button key={mentor.id} type="button" onClick={() => onPick(mentor.id)} aria-pressed={Boolean(rank)} className={frame}>
            {body}
          </button>
        );
      })}
    </div>
  );
}
