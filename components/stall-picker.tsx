"use client";

import { useState } from "react";
import { saveStallPriorities } from "@/lib/actions";
import type { AgendaMentor } from "@/lib/agenda";

export function StallPicker({
  mentors,
  first,
  second,
  confirmed,
  children,
}: {
  mentors: AgendaMentor[];
  first: string;
  second: string;
  confirmed: boolean;
  children?: React.ReactNode;
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

  const ready = Boolean(one && two);

  return (
    <form action={confirmed ? undefined : saveStallPriorities} className="flex min-h-0 flex-1 flex-col">
      {confirmed ? null : (
        <>
          <input type="hidden" name="stallOne" value={one} />
          <input type="hidden" name="stallTwo" value={two} />
        </>
      )}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-7 sm:py-7">
        {children}
        <div className="mt-4">
          <p className="text-xs font-extrabold uppercase tracking-[0.14em]">Your stalls</p>
          <p className="mt-1 text-sm leading-relaxed">
            {confirmed
              ? "Confirmed. You can't change this."
              : "Tap one for 1st and another for 2nd. Confirm locks it. You can't change it after that. On a phone, two show at once and the next one peeks in."}
          </p>
          <MentorRail mentors={mentors} one={confirmed ? first : one} two={confirmed ? second : two} onPick={confirmed ? undefined : pick} />
        </div>
      </div>
      {confirmed ? null : (
        <div className="shrink-0 border-t-[2.5px] border-[#1c1c1c] bg-[#1c1c1c] px-4 py-3 sm:px-7">
          <button
            type="submit"
            disabled={!ready}
            className="w-full border-[2.5px] border-[#ffe34a] bg-[#ffe34a] px-4 py-3.5 text-base font-extrabold text-[#1c1c1c] disabled:cursor-not-allowed disabled:border-white disabled:bg-white"
          >
            {ready ? "Confirm selection" : "Pick a 1st and a 2nd"}
          </button>
        </div>
      )}
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
