import Link from "next/link";
import { redirect } from "next/navigation";
import { Flash, btn } from "@/components/ui";
import { login } from "@/lib/actions";
import { getSessionUser } from "@/lib/auth";
import { safeReturn } from "@/lib/format";

export const metadata = { title: "Enter" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next: nextParam } = await searchParams;
  const next = safeReturn(nextParam ?? null, "");
  const user = await getSessionUser();
  if (user) redirect(user.role === "admin" ? "/admin" : next || "/dashboard");

  return (
    <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 lg:grid-cols-[1fr_0.9fr]">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em]">Class 101 · Out of Syllabus</p>
        <h1 className="mt-3 font-display text-5xl font-extrabold leading-[0.9] tracking-tight sm:text-7xl">
          Come on in.
        </h1>
        <p className="mt-4 max-w-md text-lg leading-relaxed">
          Use the name and phone number from your Luma registration. The phone number is the password.
        </p>
      </div>
      <form action={login} className="border-[1.6px] border-ink bg-paper p-6 shadow-[6px_6px_0_#0a0a0a] sm:p-8">
        <Flash error={error} />
        {next ? <input type="hidden" name="next" value={next} /> : null}
        <label className="mt-1 block text-sm font-bold" htmlFor="name">
          Name
        </label>
        <input id="name" name="name" autoComplete="name" required className="field mt-2" placeholder="The name you registered with" />
        <label className="mt-4 block text-sm font-bold" htmlFor="phone">
          Phone number
        </label>
        <input
          id="phone"
          name="phone"
          inputMode="tel"
          autoComplete="tel"
          required
          className="field mt-2"
          placeholder="Your Luma phone number"
        />
        <label className="mt-4 block text-sm font-bold" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="field mt-2"
          placeholder="Your account password"
        />
        <button className={`${btn("ink")} mt-5 w-full`} type="submit">
          Open my desk
        </button>
        <p className="mt-4 text-sm">
          No Luma registration? <Link className="font-bold underline" href={next ? `/signup?next=${encodeURIComponent(next)}` : "/signup"}>Sign up.</Link>
        </p>
        <p className="mt-2 text-sm">
          Demo desk: name <span className="font-bold">Demo Sapien</span>, phone <span className="font-bold">9000000001</span>, password <span className="font-bold">9000000001</span>.
        </p>
      </form>
    </div>
  );
}
