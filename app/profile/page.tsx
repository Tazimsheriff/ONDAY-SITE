import Link from "next/link";
import { redirect } from "next/navigation";
import { Flash, btn } from "@/components/ui";
import { updateProfile } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { listConnections } from "@/lib/db";
import { discordHandle, hrefFor } from "@/lib/format";
import { requestOrigin } from "@/lib/origin";
import { qrDataUrl } from "@/lib/qr";

export const metadata = { title: "Complete my profile" };

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; error?: string }>;
}) {
  const user = await requireUser();
  if (user.role !== "user") redirect("/admin");
  const flash = await searchParams;
  const origin = await requestOrigin();
  const preview = `${origin}/card/${user.slug}`;
  const qr = await qrDataUrl(preview);
  const local = origin.includes("localhost") || origin.includes("127.0.0.1");
  const connections = listConnections(user.id);
  const socials = [
    ["LinkedIn", hrefFor("linkedin", user.linkedin), user.linkedin],
    ["GitHub", hrefFor("github", user.github), user.github],
    ["Instagram", hrefFor("instagram", user.instagram), user.instagram],
    ["Discord", hrefFor("discord", user.discord), user.discord],
  ] as const;

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 lg:grid-cols-[0.9fr_1.1fr]">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em]">Your public card</p>
        <h1 className="mt-2 font-display text-5xl font-extrabold tracking-tight">Complete my profile</h1>
        <p className="mt-3 max-w-md leading-relaxed">
          LinkedIn, GitHub, Instagram, and Discord are all optional. Save, and the QR below opens a card with every link you filled in. A logged-in scan also makes you connections.
        </p>
        <div className="mt-6 border-[1.6px] border-ink bg-paper p-4 text-center shadow-[4px_4px_0_#0a0a0a]">
          <p className="text-xs font-bold uppercase tracking-[0.16em]">Your QR</p>
          <img src={qr} alt={`QR code for ${user.name}`} className="mx-auto mt-3 w-full max-w-[240px] border-[1.6px] border-ink bg-paper" />
          <p className="mt-3 text-sm">Whoever scans this gets your links.</p>
          {local ? (
            <p className="mt-3 border-[1.6px] border-ink bg-peach px-3 py-2 text-left text-xs leading-relaxed">
              This QR currently points at this computer only. Open the site from your network address, like http://192.168.x.x:3000, and the code will update.
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Link className={btn("ink")} href="/scan">
              Scan someone&apos;s QR
            </Link>
            <a className={btn("paper")} href={preview}>
              Preview card
            </a>
          </div>
        </div>
        <ul className="mt-6 space-y-2 text-sm">
          {socials.map(([label, href, raw]) => (
            <Social key={label} label={label} href={href} raw={raw} />
          ))}
        </ul>
        <div className="mt-6">
          <p className="text-xs font-bold uppercase tracking-[0.16em]">Connections</p>
          {connections.length ? (
            <ul className="mt-2 space-y-2">
              {connections.map((person) => (
                <li key={person.id} className="border-[1.6px] border-ink bg-cream px-3 py-2">
                  <Link className="font-bold underline-offset-2 hover:underline" href={`/card/${person.slug}`}>
                    {person.name}
                  </Link>
                  <p className="text-xs">{[person.college, person.team_name].filter(Boolean).join(" · ") || "No college yet"}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm">Nobody here yet. Scan a QR from the site, or hold yours up for someone who is signed in.</p>
          )}
        </div>
      </div>

      <form action={updateProfile} className="border-[1.6px] border-ink bg-paper p-6 shadow-[6px_6px_0_#0a0a0a]">
        <Flash error={flash.error} notice={flash.notice} />
        <p className="mt-2 text-sm">Leave any box blank. Nothing here is required.</p>
        <div className="mt-4 grid gap-4">
          <Field label="College" name="college" defaultValue={user.college} placeholder="Optional" />
          <Field label="LinkedIn" name="linkedin" defaultValue={user.linkedin} placeholder="linkedin.com/in/you or the full URL" />
          <Field label="GitHub" name="github" defaultValue={user.github} placeholder="github.com/you or @you" />
          <Field label="Instagram" name="instagram" defaultValue={user.instagram} placeholder="@you or instagram.com/you" />
          <Field label="Discord" name="discord" defaultValue={user.discord} placeholder="username, user id, or a discord.gg link" />
          <Field label="Website" name="portfolio" defaultValue={user.portfolio} placeholder="https://yoursite.com" />
          <label className="block text-sm font-bold" htmlFor="bio">
            One line about you
            <textarea id="bio" name="bio" maxLength={280} defaultValue={user.bio} className="field mt-2 min-h-24 font-medium" placeholder="Optional" />
          </label>
        </div>
        <button className={`${btn("ink")} mt-5`} type="submit">
          Save and show my QR
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue: string;
  placeholder: string;
}) {
  return (
    <label className="block text-sm font-bold" htmlFor={name}>
      {label}
      <span className="ml-2 text-[11px] font-semibold uppercase tracking-[0.12em]">Optional</span>
      <input id={name} name={name} defaultValue={defaultValue} placeholder={placeholder} className="field mt-2 font-medium" />
    </label>
  );
}

function Social({ label, href, raw }: { label: string; href: string | null; raw: string }) {
  const filled = Boolean(raw.trim());
  const handle = label === "Discord" && filled && !href ? discordHandle(raw) : "";
  return (
    <li className="flex items-center justify-between gap-3 border-[1.6px] border-ink bg-cream px-3 py-2">
      <span className="font-bold">{label}</span>
      <span className="truncate text-right">{href ? "On your card" : handle || (filled ? "On your card" : "Empty")}</span>
    </li>
  );
}
