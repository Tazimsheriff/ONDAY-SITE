import { notFound } from "next/navigation";
import { Flash } from "@/components/ui";
import { getSessionUser } from "@/lib/auth";
import { buyPass, getRedemption } from "@/lib/db";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pass = getRedemption(id);
  return { title: pass ? pass.goodie_name : "Pass" };
}

export default async function PassPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ notice?: string; error?: string }>;
}) {
  const { id } = await params;
  const flash = await searchParams;
  const viewer = await getSessionUser();
  let pass = getRedemption(id);
  if (!pass) notFound();

  let justBought = false;
  if (viewer?.role === "admin" && pass.status === "claimed") {
    justBought = buyPass(pass.id, viewer.id) === "bought";
    pass = getRedemption(id) ?? pass;
  }

  const ready = pass.status === "claimed";
  const used = pass.status === "collected";
  const item = pass.goodie_name.toLowerCase().includes("sticker")
    ? "sticker sheet"
    : pass.goodie_name.toLowerCase().includes("snack")
      ? "snack"
      : pass.goodie_name;
  const label = justBought ? "Bought" : ready ? "Valid" : used ? "Already bought" : "Refunded";
  const color = justBought || ready ? "#d2ffb6" : "#ffc0b6";
  const detail = justBought
    ? `Hand over the ${item}. Scanning this pass again will say already bought.`
    : ready
      ? "Show this to an organizer. Their scan hands it over once."
      : used
        ? `This pass was already bought. Don't hand over another ${item}.`
        : "This pass was given back before it was scanned.";

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <article className="border-[1.6px] border-ink bg-paper p-6 shadow-[8px_8px_0_#0a0a0a]" style={{ background: color }}>
        <p className="text-xs font-bold uppercase tracking-[0.16em]">{label}</p>
        <h1 className="mt-3 font-display text-5xl font-extrabold leading-none tracking-tight">{pass.goodie_name}</h1>
        <p className="mt-4 font-display text-3xl font-extrabold leading-none">{pass.user_name}</p>
        <p className="mt-2 text-sm">{pass.college || "No college on file"}</p>
        <p className="mt-4 text-sm font-semibold">{detail}</p>
        <div className="mt-4">
          <Flash error={flash.error} notice={flash.notice} />
        </div>
      </article>
    </div>
  );
}
