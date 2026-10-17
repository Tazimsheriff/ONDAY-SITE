"use client";

import { useEffect, useState } from "react";
import {
  AGENDA,
  agendaHeadline,
  minutesLeft,
  msUntilBoundary,
  nextSessionId,
  sessionState,
  timeLines,
  type AgendaSession,
  type SessionState,
} from "@/lib/agenda";

const DOT: Record<string, string> = {
  welcome: "#f0c400",
  product: "#3cbf73",
  notion: "#14998f",
  break: "#f5a142",
  quiz: "#ef5d93",
  stalls: "#f0a020",
  close: "#e2a30a",
};

export function AgendaBoard({ now }: { now: number }) {
  const [clock, setClock] = useState(now);

  useEffect(() => {
    let timer = 0;
    const arm = () => {
      const current = Date.now();
      setClock(current);
      timer = window.setTimeout(arm, msUntilBoundary(current));
    };
    timer = window.setTimeout(arm, msUntilBoundary(Date.now()));
    return () => window.clearTimeout(timer);
  }, []);

  const [openId, setOpenId] = useState<string | null>(null);
  const headline = agendaHeadline(clock);
  const nextId = AGENDA.some((session) => sessionState(session, clock, null) === "now") ? null : nextSessionId(clock);
  const finished = clock >= Date.parse(AGENDA[AGENDA.length - 1].end);
  const openSession = AGENDA.find((session) => session.id === openId) ?? null;

  return (
    <div className="w-full px-4 pb-12 pt-8 sm:px-6 lg:px-8">
      <p className="text-center font-display text-sm font-extrabold uppercase tracking-[0.08em] lg:text-base">
        <span className="inline-block -rotate-2 border-[2.5px] border-[#1c1c1c] bg-[#ffe34a] px-2.5 py-1 shadow-[3px_3px_0_#1c1c1c] lg:px-3 lg:py-1.5">
          Sapiens Campus
        </span>
      </p>

      <div className="relative mx-auto mt-5 block w-fit max-w-full text-center">
        <span className="absolute -inset-x-4 -top-2 -bottom-1 -z-0 -rotate-1 rounded-[1.75rem] bg-[#ffe34a] lg:-inset-x-8" />
        <h1 className="relative text-center font-display text-[clamp(2.7rem,8vw,7.5rem)] font-extrabold uppercase leading-[0.86] tracking-[-0.045em]">
          Your first
          <br />
          campus
          <br />
          adventure
        </h1>
      </div>
      <p className="mt-4 w-full text-center text-[1.05rem] italic leading-snug text-[#1c1c1c] lg:text-2xl">
        Meet your people. Discover your domain. Start building your future.
      </p>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-center text-sm font-extrabold lg:text-xl">
        <span className="inline-flex items-center gap-2">
          <CalendarIcon />
          Sunday, 18 October 2026
        </span>
        <span aria-hidden="true">|</span>
        <span className="inline-flex items-center gap-2">
          <ClockIcon />
          9:00 AM – 2:00 PM
        </span>
      </div>
      <p className="mt-3 text-center text-sm font-bold lg:text-xl">
        {finished ? headline.title : headline.label === "Happening now" ? `${headline.title} is on now. ${headline.detail}.` : `${headline.title} is up next. ${headline.detail}.`}
      </p>

      <h2 className="relative mt-8 inline-block font-display text-5xl font-extrabold uppercase tracking-tight sm:text-6xl lg:text-8xl">
        <span className="absolute inset-x-[-6%] bottom-[0.08em] top-[42%] -z-0 -rotate-1 rounded-[40%] bg-[#ffe34a]" />
        <span className="relative">Agenda</span>
      </h2>

      <ol className="relative mt-6">
        <span className="pointer-events-none absolute bottom-8 top-4 left-[calc(4.6rem+0.5rem+4px)] w-[3px] bg-[#1c1c1c] sm:left-[calc(7.1rem+0.75rem+6px)] lg:left-[calc(9.5rem+1rem+8px)]" />
        {AGENDA.map((session) => (
          <SessionRow key={session.id} session={session} state={sessionState(session, clock, nextId)} clock={clock} onOpen={setOpenId} />
        ))}
      </ol>

      <p className="mt-8 border-y-[3px] border-[#1c1c1c] bg-[#ffe34a] px-4 py-3 text-center text-sm font-extrabold lg:py-5 lg:text-xl">
        A student-led community. Built by students, for students.
      </p>
      <SessionDialog session={openSession} onClose={() => setOpenId(null)} />
    </div>
  );
}

function SessionRow({
  session,
  state,
  clock,
  onOpen,
}: {
  session: AgendaSession;
  state: SessionState;
  clock: number;
  onOpen: (id: string) => void;
}) {
  const lines = timeLines(session.start, session.end);
  const featured = session.id === "stalls";
  const live = state === "now";
  const done = state === "done";

  return (
    <li className="grid grid-cols-[4.6rem_0.85rem_minmax(0,1fr)] items-start gap-x-2 py-1.5 sm:grid-cols-[7.1rem_1rem_minmax(0,1fr)] sm:gap-x-3 lg:grid-cols-[9.5rem_1.35rem_minmax(0,1fr)] lg:gap-x-4 lg:py-2.5">
      <p className="pt-3 text-right text-[11px] font-extrabold leading-tight sm:whitespace-nowrap sm:text-[13px] lg:pt-5 lg:text-lg">
        {lines.map((line) => (
          <span key={line} className="block">
            {line}
          </span>
        ))}
      </p>
      <span
        className="relative z-10 mt-3.5 h-4 w-4 rounded-full border-[3px] border-[#1c1c1c] lg:mt-6 lg:h-5 lg:w-5"
        style={{
          background: DOT[session.id],
          boxShadow: live ? "0 0 0 4px #ffe34a" : undefined,
        }}
      />
      <button
        type="button"
        onClick={() => onOpen(session.id)}
        aria-haspopup="dialog"
        className={
          featured
            ? "w-full cursor-pointer rounded-[1.4rem] border-[2.5px] border-[#1c1c1c] bg-[#ffe34a] px-4 py-4 text-left shadow-[4px_4px_0_#1c1c1c] lg:px-8 lg:py-7"
            : "flex w-full cursor-pointer items-center gap-3 rounded-[1.15rem] border-[2.5px] border-[#1c1c1c] bg-white px-3 py-2.5 text-left shadow-[3px_3px_0_rgba(28,28,28,0.08)] lg:gap-4 lg:px-6 lg:py-5"
        }
        style={live && !featured ? { background: "#fff4b0" } : undefined}
      >
        {featured ? (
          <div>
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <CrownIcon />
                <h3 className="min-w-0 font-display text-3xl font-extrabold leading-none tracking-tight sm:text-4xl lg:text-6xl">Domain Mentoring Stalls</h3>
              </div>
              <Mark state={state} minutes={live ? minutesLeft(session.end, clock) : 0} />
            </div>
            <p className="mt-2 text-sm leading-relaxed lg:mt-3 lg:text-xl">{session.detail}</p>
          </div>
        ) : (
          <>
            <SessionIcon id={session.id} />
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-extrabold leading-tight sm:text-xl lg:text-3xl">
                {session.title}
                {!session.detail && session.host ? <span className="font-bold"> | {session.host}</span> : null}
              </span>
              {session.detail ? <span className="mt-1 block text-sm font-semibold leading-snug sm:text-base lg:text-xl">{session.detail}</span> : null}
              {session.detail && session.host ? <span className="mt-1 block text-sm font-bold lg:text-lg">{session.host}</span> : null}
            </span>
            <Mark state={state} minutes={live ? minutesLeft(session.end, clock) : 0} />
          </>
        )}
        {done ? <span className="sr-only">Done</span> : null}
      </button>
    </li>
  );
}

function SessionDialog({ session, onClose }: { session: AgendaSession | null; onClose: () => void }) {
  useEffect(() => {
    if (!session) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [session, onClose]);

  if (!session) return null;
  const when = timeLines(session.start, session.end).join(" ");
  const linkedin = session.linkedin.startsWith("http") ? session.linkedin : "";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#1c1c1c]/45 p-3 sm:items-center sm:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="session-title"
        className="max-h-[85vh] w-full max-w-2xl overflow-auto rounded-[1.4rem] border-[2.5px] border-[#1c1c1c] bg-[#f6efe2] p-5 shadow-[8px_8px_0_#1c1c1c] sm:p-7"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-extrabold">{when}</p>
          <button type="button" onClick={onClose} className="shrink-0 border-[2px] border-[#1c1c1c] bg-white px-3 py-1 text-sm font-extrabold">
            Close
          </button>
        </div>
        <h2 id="session-title" className="mt-3 font-display text-4xl font-extrabold leading-none tracking-tight">
          {session.title}
        </h2>
        {session.detail && !session.mentors?.length ? <p className="mt-2 text-lg font-semibold">{session.detail}</p> : null}
        {session.host ? <p className="mt-2 text-lg font-extrabold">{session.host}</p> : null}
        <p className="mt-4 text-xs font-extrabold uppercase tracking-[0.14em]">What to expect</p>
        <p className="mt-2 text-base leading-relaxed">{session.expect}</p>
        {session.mentors?.length ? (
          <div className="mt-5">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em]">Stalls</p>
            <ul className="mt-3 grid gap-3">
              {session.mentors.map((mentor) => {
                const mentorLinkedin = mentor.linkedin.startsWith("http") ? mentor.linkedin : "";
                return (
                  <li key={mentor.name} className="overflow-hidden rounded-[1.1rem] border-[2.5px] border-[#1c1c1c] bg-white">
                    {mentor.photo ? (
                      <img src={mentor.photo} alt="" className="max-h-[28rem] w-full bg-[#ffe34a] object-contain" />
                    ) : null}
                    <div className="p-4">
                      <h3 className="font-display text-3xl font-extrabold leading-none">{mentor.name}</h3>
                      {mentor.role ? <p className="mt-2 text-sm font-extrabold">{mentor.role}</p> : null}
                      <p className="mt-3 text-sm leading-relaxed">{mentor.about}</p>
                      {mentor.topics.length ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {mentor.topics.map((topic) => (
                            <span key={topic} className="border-[2px] border-[#1c1c1c] bg-[#ffe34a] px-2.5 py-1 text-xs font-extrabold">
                              {topic}
                            </span>
                          ))}
                        </div>
                      ) : null}
                      {mentorLinkedin ? (
                        <a
                          className="mt-4 inline-flex border-[2.5px] border-[#1c1c1c] bg-[#ffe34a] px-4 py-2 text-sm font-extrabold shadow-[3px_3px_0_#1c1c1c]"
                          href={mentorLinkedin}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {mentor.name} on LinkedIn
                        </a>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
        {linkedin ? (
          <a
            className="mt-5 inline-flex border-[2.5px] border-[#1c1c1c] bg-[#ffe34a] px-4 py-2 text-sm font-extrabold shadow-[3px_3px_0_#1c1c1c]"
            href={linkedin}
            target="_blank"
            rel="noreferrer"
          >
            {session.host ? `${session.host} on LinkedIn` : "LinkedIn"}
          </a>
        ) : null}
      </div>
    </div>
  );
}

function Mark({ state, minutes }: { state: SessionState; minutes: number }) {
  if (state === "done") return <CheckIcon />;
  if (state === "now") {
    return (
      <span className="shrink-0 rounded-full border-[2px] border-[#1c1c1c] bg-[#ffe34a] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.08em] lg:px-3 lg:py-1 lg:text-sm">
        Now{minutes > 1 ? ` · ${minutes}m` : ""}
      </span>
    );
  }
  if (state === "next") {
    return (
      <span className="shrink-0 rounded-full border-[2px] border-[#1c1c1c] bg-white px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.08em] lg:px-3 lg:py-1 lg:text-sm">
        Next
      </span>
    );
  }
  return null;
}

function SessionIcon({ id }: { id: string }) {
  const shell = "grid h-9 w-9 shrink-0 place-items-center rounded-xl border-[2px] border-[#1c1c1c] lg:h-14 lg:w-14 lg:[&_svg]:h-8 lg:[&_svg]:w-8";
  if (id === "welcome") {
    return (
      <span className={shell} style={{ background: "#fff4c2" }}>
        <PeopleIcon />
      </span>
    );
  }
  if (id === "product") {
    return (
      <span className={shell} style={{ background: "#efe4ff" }}>
        <ChartIcon />
      </span>
    );
  }
  if (id === "notion") {
    return (
      <span className={shell} style={{ background: "#e5f6e4" }}>
        <NotionIcon />
      </span>
    );
  }
  if (id === "break") {
    return (
      <span className={shell} style={{ background: "#fff1e2" }}>
        <CupIcon />
      </span>
    );
  }
  if (id === "quiz") {
    return (
      <span className={shell} style={{ background: "#ffe6f0" }}>
        <GameIcon />
      </span>
    );
  }
  return (
    <span className={shell} style={{ background: "#fff6d4" }}>
      <CameraIcon />
    </span>
  );
}

function CalendarIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1c1c1c" strokeWidth="2">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1c1c1c" strokeWidth="2">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v5l3 2" />
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1c1c1c" strokeWidth="2">
      <circle cx="9" cy="8" r="2.2" />
      <circle cx="16" cy="9" r="1.8" />
      <path d="M4.5 18c.6-2.4 2.4-3.6 4.5-3.6S13 15.6 13.6 18M14 14.6c1.6-.3 3 .6 3.8 2.4" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="#7c5cbf">
      <path d="M4 19V10h3v9H4zm6.5 0V5h3v14h-3zM17 19v-7h3v7h-3z" />
    </svg>
  );
}

function NotionIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="#1c1c1c">
      <path d="M6 4h9l3 3v13H6V4zm2 2v12h8V8.2L14.2 6H8zm2 4h5v1.5h-5V10zm0 3h5v1.5h-5V13z" />
    </svg>
  );
}

function CupIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1c1c1c" strokeWidth="2">
      <path d="M6 8h9v6a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4V8z" />
      <path d="M15 9h2.5a2.5 2.5 0 0 1 0 5H15M8 20h6" />
    </svg>
  );
}

function GameIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1c1c1c" strokeWidth="2">
      <path d="M7 9h10a4 4 0 0 1 3.8 5.2l-1 3.2a2 2 0 0 1-3.2.8L15 16H9l-1.6 2.2a2 2 0 0 1-3.2-.8l-1-3.2A4 4 0 0 1 7 9z" />
      <path d="M8 12v3M6.5 13.5h3M16 12.5h.01M18 14.5h.01" />
    </svg>
  );
}

function CrownIcon() {
  return (
    <svg aria-hidden="true" width="28" height="28" viewBox="0 0 24 24" fill="#1c1c1c">
      <path d="M3 17h18l-1.5-9-4.2 4.2L12 6l-3.3 6.2L4.5 8 3 17zm2 2h14v2H5v-2z" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1c1c1c" strokeWidth="2">
      <path d="M8 7l1.2-2h5.6L16 7h3v11H5V7h3z" />
      <circle cx="12" cy="12.5" r="3" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border-[2px] border-[#1c1c1c] bg-[#ffe34a]">
      <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1c1c1c" strokeWidth="3">
        <path d="M5 12.5 10 17l9-10" />
      </svg>
    </span>
  );
}
