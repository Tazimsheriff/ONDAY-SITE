import Link from "next/link";
import { btn } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-20">
      <p className="text-xs font-bold uppercase tracking-[0.18em]">404</p>
      <h1 className="mt-3 font-display text-5xl font-extrabold tracking-tight">That page left the syllabus.</h1>
      <Link className={`${btn("ink")} mt-6`} href="/">
        Back to Class 101
      </Link>
    </div>
  );
}
