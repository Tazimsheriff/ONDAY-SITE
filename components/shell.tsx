import Link from "next/link";
import { logout } from "@/lib/actions";
import { getSessionUser } from "@/lib/auth";
import { btn } from "./ui";

export async function SiteHeader() {
  const user = await getSessionUser();

  return (
    <header className="sticky top-0 z-40 border-b-[1.6px] border-ink bg-yellow pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-3 py-2 sm:gap-x-5 sm:px-4 sm:py-3">
        <Link href={user ? "/dashboard" : "/"} className="flex min-w-0 items-center gap-2">
          <img
            src="/logo.jpg"
            alt=""
            className="h-10 w-10 shrink-0 border-[1.6px] border-ink bg-white object-cover object-[center_28%] shadow-[2px_2px_0_#0a0a0a] sm:h-12 sm:w-12"
          />
          <span className="min-w-0 leading-none">
            <span className="block truncate font-display text-[1.05rem] font-extrabold tracking-tight sm:text-[1.35rem]">Sapiens Campus</span>
            <span className="block text-[11px] font-semibold uppercase tracking-[0.16em]">Class 101</span>
          </span>
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 text-sm font-medium">
          <Link className="underline-offset-4 hover:underline" href="/leaderboard">
            Board
          </Link>
          {user?.role === "user" ? (
            <>
              <Link className="underline-offset-4 hover:underline" href="/dashboard">
                Desk
              </Link>
              <Link className="underline-offset-4 hover:underline" href="/scan">
                Scan
              </Link>
              <Link className="underline-offset-4 hover:underline" href="/redeem">
                Dollars
              </Link>
              <Link className="underline-offset-4 hover:underline" href="/profile">
                Profile
              </Link>
            </>
          ) : null}
          {user?.role === "admin" ? (
            <Link className="underline-offset-4 hover:underline" href="/admin">
              Admin
            </Link>
          ) : null}
          {user ? (
            <form action={logout}>
              <button className={btn("ink", "px-3 py-1.5 shadow-[2px_2px_0_#0a0a0a]")}>Log out</button>
            </form>
          ) : (
            <Link className={btn("ink", "px-3 py-1.5 shadow-[2px_2px_0_#0a0a0a]")} href="/login">
              Enter
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t-[1.6px] border-ink bg-ink pb-[env(safe-area-inset-bottom)] text-yellow">
      <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-4 px-4 py-8">
        <div>
          <p className="font-display text-2xl font-extrabold text-cream">Out of Syllabus.</p>
          <p className="mt-1 max-w-md text-sm text-yellow">
            The first-year freshers meetup for Sapiens Campus. By the students, for the students.
          </p>
        </div>
        <a className="text-sm font-semibold underline-offset-4 hover:underline" href="https://codesapiens.in/">
          codesapiens.in
        </a>
      </div>
    </footer>
  );
}
