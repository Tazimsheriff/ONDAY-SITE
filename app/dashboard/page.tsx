import Link from "next/link";
import { Card, Eyebrow, btn } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { listConnections, listTeams, personRank } from "@/lib/db";
import { requestOrigin } from "@/lib/origin";
import { qrDataUrl } from "@/lib/qr";
import { teamColor } from "@/lib/format";

export const metadata = { title: "Desk" };

export default async function DashboardPage() {
  const user = await requireUser();
  if (user.role === "admin") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="font-display text-5xl font-extrabold">Organizer desk</h1>
        <p className="mt-3 text-lg">Teams, points, Sapien Dollars, and every login live in the admin. Scan a snack pass from the Scan tab.</p>
        <Link className={`${btn("ink")} mt-6`} href="/admin">
          Open admin
        </Link>
      </div>
    );
  }

  const teams = listTeams();
  const team = teams.find((entry) => entry.id === user.team_id);
  const teamMarks = team?.marks ?? 0;
  const teamRank = team && teamMarks > 0 ? teams.filter((entry) => (entry.marks ?? 0) > teamMarks).length + 1 : null;
  const rank = user.points > 0 ? personRank(user.points, user.name_key) : null;
  const origin = await requestOrigin();
  const cardUrl = `${origin}/card/${user.slug}`;
  const qr = await qrDataUrl(cardUrl);
  const local = origin.includes("localhost") || origin.includes("127.0.0.1");
  const linksReady = Boolean(user.linkedin || user.instagram || user.github || user.discord);
  const connections = listConnections(user.id);
  const color = teamColor(user.team_color || "butter");

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <p className="text-xs font-bold uppercase tracking-[0.18em]">Class 101 desk</p>
      <h1 className="mt-2 break-words font-display text-4xl font-extrabold tracking-tight sm:text-6xl">Hey, {firstName(user.name)}.</h1>
      <p className="mt-2 text-lg">
        {[user.college, user.year, user.team_name].filter(Boolean).join(" · ") || "Your card is still mostly blank."}
      </p>

      <div className="mt-8 grid gap-4 lg:grid-cols-[1.35fr_0.75fr]">
        <div className="grid gap-4">
          <Card color="#d2ffb6">
            <Eyebrow color="#fefcf5">Your task</Eyebrow>
            <p className="mt-4 font-display text-3xl font-extrabold leading-tight">
              {user.task || "Waiting on the organizers."}
            </p>
            {!user.task ? (
              <p className="mt-2 text-sm">When a task is assigned, it lands here. Everyone can know this one.</p>
            ) : null}
          </Card>

          <Card color="#e3b6ff">
            <div className="flex items-start justify-between gap-3">
              <Eyebrow color="#fefcf5">Secret task</Eyebrow>
              <span className="border-[1.6px] border-ink bg-ink px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-cream">
                Only you
              </span>
            </div>
            <p className="mt-4 font-display text-3xl font-extrabold leading-tight">
              {user.secret_task || "Nothing classified yet."}
            </p>
            <p className="mt-2 text-sm">This stays off your QR card and off the leaderboard.</p>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card color="#ffd966">
              <p className="text-xs font-bold uppercase tracking-[0.16em]">Points</p>
              <p className="mt-2 font-display text-5xl font-extrabold leading-none">{user.points}</p>
              <p className="mt-2 text-sm">
                {rank ? `Individual rank #${rank}` : "No points yet"}
              </p>
            </Card>
            <Card color="#b6eaff">
              <p className="text-xs font-bold uppercase tracking-[0.16em]">Sapien Dollars</p>
              <p className="mt-2 font-display text-5xl font-extrabold leading-none">S${user.dollars}</p>
              <Link className="mt-3 inline-block text-sm font-bold underline" href="/redeem">
                Spend them
              </Link>
            </Card>
          </div>
        </div>

        <div className="grid content-start gap-4">
          <Card color="#fefcf5" className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.16em]">Your QR</p>
            <img src={qr} alt={`QR code for ${user.name}`} className="mx-auto mt-3 w-full max-w-[260px] border-[1.6px] border-ink bg-paper" />
            <Link className={`${btn("paper")} mt-4 w-full`} href={`/card/${user.slug}`}>
              Show my card
            </Link>
            <p className="mt-3 text-sm">Hold this up, or scan theirs from the site.</p>
            <Link className={`${btn("ink")} mt-4 w-full`} href="/scan">
              Scan someone&apos;s QR
            </Link>
            {local ? (
              <p className="mt-3 border-[1.6px] border-ink bg-peach px-3 py-2 text-left text-xs leading-relaxed">
                This QR currently points at this computer only. Open the site from your network address, like http://192.168.x.x:3000, and the code will update.
              </p>
            ) : null}
          </Card>

          <Card color={color}>
            <p className="text-xs font-bold uppercase tracking-[0.16em]">Team</p>
            <p className="mt-2 font-display text-4xl font-extrabold leading-none">{user.team_name || "Unassigned"}</p>
            <p className="mt-2 text-sm">
              {team
                ? teamRank
                  ? `Team rank #${teamRank} · ${teamMarks} marks`
                  : "On the board once the team scores."
                : "You'll see your team here once it's allotted."}
            </p>
          </Card>

          <Card color="#fefcf5">
            <p className="text-xs font-bold uppercase tracking-[0.16em]">Connections</p>
            {connections.length ? (
              <ul className="mt-3 space-y-2 text-left text-sm">
                {connections.map((person) => (
                  <li key={person.id}>
                    <Link className="font-bold underline-offset-2 hover:underline" href={`/card/${person.slug}`}>
                      {person.name}
                    </Link>
                    <p className="text-xs">{[person.college, person.team_name].filter(Boolean).join(" · ") || "No college yet"}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm">Scan a QR from the site and they show up here, on your account.</p>
            )}
          </Card>

          <Card color={linksReady ? "#d2ffb6" : "#ffc0b6"}>
            <p className="font-display text-2xl font-extrabold">{linksReady ? "Your card is live." : "Complete my profile"}</p>
            <p className="mt-2 text-sm">
              {linksReady
                ? "Your links are on the QR. A scan makes you connections."
                : "Add LinkedIn, GitHub, Instagram, or Discord. Every field is optional."}
            </p>
            <Link className={`${btn("ink", "mt-4")}`} href="/profile">
              Complete my profile
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}

function firstName(name: string): string {
  const clean = name.replace(/\./g, " ").replace(/\s+/g, " ").trim();
  return clean.split(" ")[0] || name;
}
