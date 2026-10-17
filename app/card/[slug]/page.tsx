import Link from "next/link";
import { notFound } from "next/navigation";
import { Eyebrow, btn } from "@/components/ui";
import { getSessionUser } from "@/lib/auth";
import { getUserBySlug, hasScanned, recordConnection } from "@/lib/db";
import { discordHandle, hrefFor, parseSignals, teamColor } from "@/lib/format";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = getUserBySlug(slug);
  return { title: user ? user.name : "Card" };
}

export default async function CardPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = getUserBySlug(slug);
  if (!user) notFound();
  const viewer = await getSessionUser();
  const mine = viewer?.id === user.id;
  let repeat = false;
  if (viewer && viewer.role === "user" && !mine) {
    repeat = hasScanned(viewer.id, user.id);
    if (!repeat) recordConnection(viewer.id, user.id);
  }
  const color = teamColor(user.team_color || "butter");
  const signals = parseSignals(user.signals);
  const links = [
    ["LinkedIn", hrefFor("linkedin", user.linkedin), ""],
    ["GitHub", hrefFor("github", user.github), ""],
    ["Instagram", hrefFor("instagram", user.instagram), ""],
    ["Discord", hrefFor("discord", user.discord), user.discord.trim() ? discordHandle(user.discord) : ""],
    ["Website", hrefFor("web", user.portfolio), ""],
  ].filter((entry) => Boolean(entry[1] || entry[2]));
  const returnTo = `/card/${user.slug}`;

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <article className="border-[1.6px] border-ink bg-paper shadow-[8px_8px_0_#0a0a0a]">
        <div className="flex items-center justify-between gap-3 border-b-[1.6px] border-ink px-5 py-3" style={{ background: color }}>
          <p className="text-xs font-bold uppercase tracking-[0.16em]">Sapiens Campus</p>
          <p className="text-xs font-bold uppercase tracking-[0.16em]">{user.team_name || "No team yet"}</p>
        </div>
        <div className="px-5 py-6">
          {mine ? <Eyebrow color="#ffd966">This is your card</Eyebrow> : <Eyebrow>You scanned</Eyebrow>}
          <h1 className="mt-4 break-words font-display text-5xl font-extrabold leading-[0.9] tracking-tight">{user.name}</h1>
          <p className="mt-3 text-lg">{[user.college || "College not added", user.year].filter(Boolean).join(" · ")}</p>
          {user.bio ? <p className="mt-4 border-l-[3px] border-ink pl-3 leading-relaxed">{user.bio}</p> : null}

          {repeat ? (
            <p className="mt-4 border-[1.6px] border-ink bg-peach px-3 py-2 text-sm font-bold">
              You already scanned {user.name}. The same card doesn&apos;t count again.
            </p>
          ) : viewer?.role === "user" && !mine ? (
            <p className="mt-4 border-[1.6px] border-ink bg-mint px-3 py-2 text-sm font-bold">
              You&apos;re connected with {user.name}. They&apos;re on your account.{" "}
              <Link className="underline" href="/dashboard">
                See your desk
              </Link>
            </p>
          ) : null}

          <div className="mt-6 grid gap-2">
            {links.length ? (
              links.map(([label, href, handle]) =>
                href ? (
                  <a key={label} className={btn("paper", "justify-between")} href={href} target="_blank" rel="noreferrer">
                    <span>{label}</span>
                    <span aria-hidden="true">↗</span>
                  </a>
                ) : (
                  <p key={label} className="flex items-center justify-between gap-3 border-[1.6px] border-ink bg-paper px-4 py-3 text-sm font-bold shadow-[3px_3px_0_#0a0a0a]">
                    <span>Discord</span>
                    <span className="truncate font-medium">{handle}</span>
                  </p>
                ),
              )
            ) : (
              <p className="border-[1.6px] border-ink bg-peach px-4 py-3 text-sm">
                No social links on this card yet.
              </p>
            )}
          </div>

          {signals.length ? (
            <ul className="mt-6 flex flex-wrap gap-2">
              {signals.map((signal) => (
                <li key={signal} className="border-[1.6px] border-ink bg-cream px-2.5 py-1 text-xs font-bold">
                  {signal}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="flex items-center justify-between gap-3 border-t-[1.6px] border-ink bg-ink px-5 py-3 text-sm text-yellow">
          <span>{user.points} pts</span>
          <span>S${user.dollars}</span>
        </div>
      </article>
      {!viewer ? (
        <p className="mt-6 text-center text-sm">
          Log in so this scan becomes a connection.{" "}
          <Link className="font-bold underline" href={`/login?next=${encodeURIComponent(returnTo)}`}>Enter</Link>
          {" · "}
          <Link className="font-bold underline" href={`/signup?next=${encodeURIComponent(returnTo)}`}>Sign up</Link>
        </p>
      ) : null}
    </div>
  );
}
