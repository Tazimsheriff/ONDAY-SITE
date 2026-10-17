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
                <PeopleList people={first} empty="Nobody has picked this first." showSecond />
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

function PeopleBlock({
  title,
  people,
  note,
}: {
  title: string;
  people: { id: string; name: string; college: string; team_name?: string | null; stall_one: string; stall_two: string }[];
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
}: {
  people: { id: string; name: string; college: string; team_name?: string | null; stall_one: string; stall_two: string }[];
  empty: string;
  showSecond?: boolean;
  showFirst?: boolean;
}) {
  const ordered = [...people].sort((a, b) => a.name.localeCompare(b.name));
  if (!ordered.length) return <p className="px-4 py-3 text-sm">{empty}</p>;
  return (
    <ul className="divide-y-[1.6px] divide-ink">
      {ordered.map((student) => (
        <li key={student.id} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 px-4 py-3">
          <div>
            <Link className="font-bold underline-offset-2 hover:underline" href={`/admin/students/${student.id}`}>
              {student.name}
            </Link>
            <p className="text-xs">{[student.college, student.team_name].filter(Boolean).join(" · ")}</p>
          </div>
          {showSecond && student.stall_two ? <p className="text-xs font-bold">2nd {stallLabel(student.stall_two)}</p> : null}
          {showFirst && student.stall_one ? <p className="text-xs font-bold">1st {stallLabel(student.stall_one)}</p> : null}
        </li>
      ))}
    </ul>
  );
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
