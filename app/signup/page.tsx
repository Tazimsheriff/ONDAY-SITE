import Link from "next/link";
import { redirect } from "next/navigation";
import { Flash, btn } from "@/components/ui";
import { signup } from "@/lib/actions";
import { getSessionUser } from "@/lib/auth";
import { safeReturn } from "@/lib/format";

export const metadata = { title: "Sign up" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next: nextParam } = await searchParams;
  const next = safeReturn(nextParam ?? null, "");
  const user = await getSessionUser();
  if (user) redirect(user.role === "admin" ? "/admin" : next || "/dashboard");

  return (
    <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-8 sm:gap-10 sm:py-16 lg:grid-cols-[1fr_0.9fr]">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em]">Class 101 · Out of Syllabus</p>
        <h1 className="mt-3 font-display text-5xl font-extrabold leading-[0.9] tracking-tight sm:text-7xl">
          Make a desk.
        </h1>
        <p className="mt-4 max-w-md text-lg leading-relaxed">
          Pick a name and a 10-digit phone number. That phone number is the password. You can log in with it again later.
        </p>
        <div className="mt-6 max-w-md border-[1.6px] border-ink bg-yellow p-4 shadow-[4px_4px_0_#0a0a0a]">
          <p className="text-xs font-bold uppercase tracking-[0.16em]">Already made demo</p>
          <p className="mt-2 font-display text-2xl font-extrabold">Demo Sapien</p>
          <p className="mt-1 text-sm">Phone and password: 9000000001</p>
          <Link className={`${btn("ink")} mt-4`} href="/login">
            Log in as demo
          </Link>
        </div>
      </div>
      <form action={signup} className="border-[1.6px] border-ink bg-paper p-6 shadow-[6px_6px_0_#0a0a0a] sm:p-8">
        <Flash error={error} />
        {next ? <input type="hidden" name="next" value={next} /> : null}
        <label className="mt-1 block text-sm font-bold" htmlFor="name">
          Name
          <input id="name" name="name" autoComplete="name" required className="field mt-2 font-medium" placeholder="Your name" />
        </label>
        <label className="mt-4 block text-sm font-bold" htmlFor="phone">
          Phone number
          <input id="phone" name="phone" inputMode="tel" autoComplete="tel" required className="field mt-2 font-medium" placeholder="10-digit phone" />
        </label>
        <label className="mt-4 block text-sm font-bold" htmlFor="college">
          College
          <input id="college" name="college" className="field mt-2 font-medium" placeholder="Optional" />
        </label>
        <button className={`${btn("ink")} mt-5 w-full`} type="submit">
          Create my desk
        </button>
        <p className="mt-4 text-sm">
          Already registered? <Link className="font-bold underline" href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"}>Enter instead.</Link>
        </p>
      </form>
    </div>
  );
}
