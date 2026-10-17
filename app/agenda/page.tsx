import { AgendaBoard } from "@/components/agenda-board";
import { getSessionUser } from "@/lib/auth";
import { listStallPicks } from "@/lib/db";
import { flashText } from "@/lib/format";
import { stallList } from "@/lib/agenda";

export const metadata = { title: "Agenda" };

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const user = await getSessionUser();
  const stalls = stallList();
  const picks = user?.role === "admin" ? listStallPicks() : [];
  const counts = stalls.map((stall) => ({
    id: stall.id,
    label: `${stall.topic} · ${stall.name}`,
    first: picks.filter((pick) => pick.stall_one === stall.id).length,
    second: picks.filter((pick) => pick.stall_two === stall.id).length,
  }));

  return (
    <div className="min-h-full bg-[#f6efe2]">
      <AgendaBoard
        now={Date.now()}
        role={user?.role === "admin" || user?.role === "user" ? user.role : null}
        first={user?.role === "user" ? user.stall_one : ""}
        second={user?.role === "user" ? user.stall_two : ""}
        confirmed={user?.role === "user" ? Boolean(user.stall_confirmed) : false}
        counts={counts}
        banner={flashText(sp.notice) || flashText(sp.error)}
      />
    </div>
  );
}
