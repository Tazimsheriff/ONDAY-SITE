import Link from "next/link";
import { stallLabel, stallList } from "@/lib/agenda";
import { listStudents } from "@/lib/db";

export const metadata = { title: "Stalls" };

export default async function StallsPage({
  searchParams,
}: {
  searchParams: Promise<{ stall?: string }>;
}) {
  const stall = (await searchParams).stall || "";
  const stalls = stallList();
  const people = listStudents().filter((student) => student.approval_status !== "removed");
  const chosen = people.filter((student) => student.stall_one);
  const waiting = people.filter((student) => !student.stall_one);
  const showing = stalls.filter((item) => !stall || stall === item.id);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-display text-5xl font-extrabold tracking-tight">Send them to a stall.</h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed">
        First choice is who goes to that stall. Second choice is the backup if the first stall is full.
      </p>
      <p className="mt-3 border-[1.6px] border-ink bg-yellow px-3 py-2 text-sm font-bold shadow-[3px_3px_0_#0a0a0a] sm:inline-block">
        {chosen.length} chosen · {waiting.length} not yet
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Filter href="/admin/stalls" active={!stall}>
          All first choices
        </Filter>
        {stalls.map((item) => (
          <Filter key={item.id} href={`/admin/stalls?stall=${item.id}`} active={stall === item.id}>
            {item.topic} {people.filter((student) => student.stall_one === item.id).length}
          </Filter>
        ))}
        <Filter href="/admin/stalls?stall=none" active={stall === "none"}>
          No choice {waiting.length}
        </Filter>
      </div>

      {stall === "none" ? (
        <PeopleBlock title="No stall yet" people={waiting} note={`${waiting.length} have not picked a first stall.`} />
      ) : (
        <div className="mt-6 grid gap-4">
          {showing.map((item) => {
            const first = people.filter((student) => student.stall_one === item.id);
            const second = people.filter((student) => student.stall_two === item.id);
            return (
              <section key={item.id} className="border-[1.6px] border-ink bg-paper shadow-[4px_4px_0_#0a0a0a]">
                <div className="border-b-[1.6px] border-ink bg-yellow px-4 py-3">
                  <h2 className="font-display text-3xl font-extrabold leading-none">{item.topic}</h2>
                  <p className="mt-1 text-sm font-bold">
                    {item.name} · {first.length} first{stall ? ` · ${second.length} second` : ""}
                  </p>
                </div>
                <PeopleList people={first} empty="Nobody has picked this first." showSecond ranked />
                {stall ? (
                  <>
                    <h3 className="border-t-[1.6px] border-ink px-4 py-3 text-sm font-extrabold uppercase tracking-[0.12em]">
                      Picked this second
                    </h3>
                    <PeopleList people={second} empty="Nobody has this as a backup." showFirst />
                  </>
                ) : null}
              </section>
            );
          })}
          {!stall ? (
            <p className="text-sm font-bold">
              <Link className="underline" href="/admin/stalls?stall=none">
                {waiting.length} have not picked a first stall.
              </Link>
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}

type Person = {
  id: string;
  name: string;
  college: string;
  team_name?: string | null;
  stall_one: string;
  stall_two: string;
  stall_picked_at: string;
};

function PeopleBlock({
  title,
  people,
  note,
}: {
  title: string;
  people: Person[];
  note: string;
}) {
  return (
    <section className="mt-6 border-[1.6px] border-ink bg-paper shadow-[4px_4px_0_#0a0a0a]">
      <div className="border-b-[1.6px] border-ink px-4 py-3">
        <h2 className="font-display text-3xl font-extrabold leading-none">{title}</h2>
        <p className="mt-1 text-sm font-bold">{note}</p>
      </div>
      <PeopleList people={people} empty="Everyone has picked." showSecond />
    </section>
  );
}

function PeopleList({
  people,
  empty,
  showSecond,
  showFirst,
  ranked,
}: {
  people: Person[];
  empty: string;
  showSecond?: boolean;
  showFirst?: boolean;
  ranked?: boolean;
}) {
  const ordered = [...people].sort(ranked ? byPickTime : (a, b) => a.name.localeCompare(b.name));
  if (!ordered.length) return <p className="px-4 py-3 text-sm">{empty}</p>;
  const missingTime = ranked && ordered.some((student) => !student.stall_picked_at);
  return (
    <>
      {ranked ? <p className="px-4 pt-3 text-xs font-bold">1 picked this stall first. Send from the top.</p> : null}
      {missingTime ? <p className="px-4 pt-1 text-xs">Earlier means they picked before the order was saved.</p> : null}
      <ul className="divide-y-[1.6px] divide-ink">
        {ordered.map((student, index) => (
          <li key={student.id} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 px-4 py-3">
            <div className="flex min-w-0 items-baseline gap-3">
              {ranked ? <span className="font-display text-2xl font-extrabold leading-none">{index + 1}</span> : null}
              <div>
                <Link className="font-bold underline-offset-2 hover:underline" href={`/admin/students/${student.id}`}>
                  {student.name}
                </Link>
                <p className="text-xs">{[student.college, student.team_name].filter(Boolean).join(" · ")}</p>
              </div>
            </div>
            <div className="text-right text-xs font-bold">
              {ranked ? <p>{pickedClock(student.stall_picked_at)}</p> : null}
              {showSecond && student.stall_two ? <p>2nd {stallLabel(student.stall_two)}</p> : null}
              {showFirst && student.stall_one ? <p>1st {stallLabel(student.stall_one)}</p> : null}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

function byPickTime(a: Person, b: Person): number {
  if (a.stall_picked_at && b.stall_picked_at) return a.stall_picked_at.localeCompare(b.stall_picked_at) || a.name.localeCompare(b.name);
  if (a.stall_picked_at) return 1;
  if (b.stall_picked_at) return -1;
  return a.name.localeCompare(b.name);
}

function pickedClock(value: string): string {
  if (!value) return "Earlier";
  return new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function Filter({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="border-[1.6px] border-ink px-2.5 py-2 text-xs font-bold"
      style={{ background: active ? "#0a0a0a" : "#fefcf5", color: active ? "#feeec3" : "#0a0a0a" }}
    >
      {children}
    </Link>
  );
}
