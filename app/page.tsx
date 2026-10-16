import Link from "next/link";
import { Eyebrow, btn } from "@/components/ui";
import { eventStats, listGoodies } from "@/lib/db";

export default function HomePage() {
  const stats = eventStats();
  const goodies = listGoodies();

  return (
    <div>
      <section className="mx-auto max-w-6xl px-4 pb-8 pt-16 text-center sm:pt-24">
        <Eyebrow>First-year meetup</Eyebrow>
        <h1 className="mx-auto mt-6 max-w-5xl font-display text-[clamp(3.4rem,11vw,7.6rem)] font-extrabold leading-[0.84] tracking-[-0.045em]">
          Out of Syllabus
        </h1>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <span className="border-[1.6px] border-ink bg-mintcard px-3 py-1.5 text-sm font-bold shadow-[2px_2px_0_#0a0a0a]">
            Explore.
          </span>
          <span className="border-[1.6px] border-ink bg-sky px-3 py-1.5 text-sm font-bold shadow-[2px_2px_0_#0a0a0a]">
            Connect.
          </span>
          <span className="border-[1.6px] border-ink bg-yellow px-3 py-1.5 text-sm font-bold shadow-[2px_2px_0_#0a0a0a]">
            Compete.
          </span>
        </div>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed">
          Class 101 is the Sapiens Campus freshers meetup. You get a task, a secret task, a team, and a currency called Sapien Dollars.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link className={btn("ink")} href="/login">
            Enter the meetup
          </Link>
          <Link className={btn("paper")} href="/leaderboard">
            See the board
          </Link>
        </div>
        <div className="mx-auto mt-10 grid max-w-2xl grid-cols-3 gap-3">
          <Stat value={String(stats.students)} label="Sapiens" color="#e3b6ff" />
          <Stat value={String(stats.teams)} label="Teams" color="#b6eaff" />
          <Stat value={String(goodies.length)} label="Goodies" color="#d2ffb6" />
        </div>
      </section>

      <div className="overflow-hidden border-y-[1.6px] border-ink bg-ink text-yellow">
        <div className="ticker py-3 font-display text-sm font-bold tracking-[0.18em]">
          {Array.from({ length: 2 }).map((_, index) => (
            <span key={index} className="px-3">
              CLASS 101 · OUT OF SYLLABUS · FIRST YEAR FRESHERS · SAPIEN DOLLARS · SCAN TO CONNECT · TASKS AND SECRET TASKS ·
            </span>
          ))}
        </div>
      </div>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-16 md:grid-cols-3">
        <Step
          index="01"
          title="Enter"
          color="#d2ffb6"
          body="Your name is the login. Your phone number is the password. Same ones you put on the Luma form."
        />
        <Step
          index="02"
          title="Play"
          color="#b6eaff"
          body="The desk shows your task, your secret task, and your team. Points climb the board. Sapien Dollars buy the goodies."
        />
        <Step
          index="03"
          title="Connect"
          color="#e3b6ff"
          body="Fill your card with college, LinkedIn, Instagram, and GitHub. Someone scans your QR and they can actually reach you."
        />
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-8">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="border-[1.6px] border-ink bg-paper p-6 shadow-[6px_6px_0_#0a0a0a] sm:p-8">
            <Eyebrow color="#ffd966">On your desk</Eyebrow>
            <h2 className="mt-4 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
              Everything for the night, in one login.
            </h2>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                ["The task", "What you're doing in the open."],
                ["The secret task", "Yours alone. It never shows on your card."],
                ["The team", "Allotted before the doors, or while you're in the room."],
                ["The dollars", "Sapien Dollars, spent on stickers, snacks, and the better stuff."],
              ].map(([title, body]) => (
                <li key={title} className="border-[1.6px] border-ink bg-cream p-4">
                  <p className="font-display text-xl font-extrabold">{title}</p>
                  <p className="mt-1 text-sm leading-relaxed">{body}</p>
                </li>
              ))}
            </ul>
          </div>
          <div className="border-[1.6px] border-ink bg-ink p-6 text-cream shadow-[6px_6px_0_#ffd966] sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-yellow">Currency</p>
            <p className="mt-3 font-display text-5xl font-extrabold leading-none tracking-tight">S$</p>
            <h2 className="mt-4 font-display text-3xl font-extrabold">Sapien Dollar</h2>
            <p className="mt-3 text-sm leading-relaxed text-yellow">
              Organizers hand these out. They are not the points on the leaderboard. Points rank you. Dollars redeem.
            </p>
            <ul className="mt-6 space-y-2 text-sm">
              {goodies.map((goodie) => (
                <li key={goodie.id} className="flex items-center justify-between gap-3 border border-yellow/40 px-3 py-2">
                  <span>{goodie.name}</span>
                  <span className="font-bold text-yellow">S${goodie.cost}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div className="border-[1.6px] border-ink px-2 py-4 shadow-[4px_4px_0_#0a0a0a]" style={{ background: color }}>
      <p className="font-display text-3xl font-extrabold leading-none sm:text-4xl">{value}</p>
      <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.14em]">{label}</p>
    </div>
  );
}

function Step({ index, title, body, color }: { index: string; title: string; body: string; color: string }) {
  return (
    <article className="border-[1.6px] border-ink bg-paper p-5 shadow-[4px_4px_0_#0a0a0a]">
      <span className="inline-block border-[1.6px] border-ink px-2 py-1 font-display text-sm font-extrabold" style={{ background: color }}>
        {index}
      </span>
      <h2 className="mt-4 font-display text-3xl font-extrabold">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed">{body}</p>
    </article>
  );
}
