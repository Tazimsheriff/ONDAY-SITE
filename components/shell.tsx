import Link from "next/link";
import { logout } from "@/lib/actions";
import { getSessionUser } from "@/lib/auth";
import { NavLink } from "./nav-link";
import { btn } from "./ui";

export async function SiteHeader() {
  const user = await getSessionUser();

  const account = user ? (
    <form action={logout}>
      <button className={btn("ink", "px-3 py-1.5 shadow-[2px_2px_0_#0a0a0a]")}>Log out</button>
    </form>
  ) : (
    <Link className={btn("ink", "px-3 py-1.5 shadow-[2px_2px_0_#0a0a0a]")} href="/login">
      Enter
    </Link>
  );

  return (
    <header className="sticky top-0 z-40 border-b-[1.6px] border-ink bg-yellow pt-[env(safe-area-inset-top)]">
      <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-3 py-2 sm:flex sm:items-center sm:justify-between sm:px-4 sm:py-3">
        <Link href={user ? "/dashboard" : "/"} className="col-start-1 row-start-1 flex min-w-0 items-center gap-2">
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
        <div className="col-span-2 row-start-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 sm:col-auto sm:row-auto sm:justify-end sm:gap-5">
          <nav className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm font-medium">
            <NavLink href="/agenda">Agenda</NavLink>
            <NavLink href="/leaderboard">Board</NavLink>
            {user?.role === "user" ? (
              <>
                <NavLink href="/dashboard">Desk</NavLink>
                <NavLink href="/scan">Scan</NavLink>
                <NavLink href="/redeem">Dollars</NavLink>
                <NavLink href="/profile">Profile</NavLink>
              </>
            ) : null}
            {user?.role === "admin" ? (
              <>
                <NavLink href="/scan">Scan</NavLink>
                <NavLink href="/admin">Admin</NavLink>
              </>
            ) : null}
          </nav>
          <div className="hidden sm:block">{account}</div>
        </div>
        <div className="col-start-2 row-start-1 shrink-0 sm:hidden">{account}</div>
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
