import { AgendaBoard } from "@/components/agenda-board";

export const metadata = { title: "Agenda" };

export default function AgendaPage() {
  return (
    <div className="min-h-full bg-[#f6efe2]">
      <AgendaBoard now={Date.now()} />
    </div>
  );
}
