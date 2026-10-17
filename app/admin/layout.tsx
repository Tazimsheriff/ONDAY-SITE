import Link from "next/link";
import { requireAdmin } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div>
      <div className="border-b-[1.6px] border-ink bg-ink text-cream">
        <nav className="mx-auto flex max-w-6xl flex-wrap gap-x-4 gap-y-1 px-3 py-2 text-sm font-semibold sm:px-4 sm:py-3">
          <Link className="py-2 hover:text-yellow" href="/admin">Overview</Link>
          <Link className="py-2 hover:text-yellow" href="/admin/students">Sapiens</Link>
          <Link className="py-2 hover:text-yellow" href="/admin/teams">Teams</Link>
          <Link className="py-2 hover:text-yellow" href="/admin/stalls">Stalls</Link>
          <Link className="py-2 hover:text-yellow" href="/admin/goodies">Goodies</Link>
        </nav>
      </div>
      {children}
    </div>
  );
}
