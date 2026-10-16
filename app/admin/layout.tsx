import Link from "next/link";
import { requireAdmin } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div>
      <div className="border-b-[1.6px] border-ink bg-ink text-cream">
        <nav className="mx-auto flex max-w-6xl flex-wrap gap-x-5 gap-y-2 px-4 py-3 text-sm font-semibold">
          <Link className="hover:text-yellow" href="/admin">Overview</Link>
          <Link className="hover:text-yellow" href="/admin/students">Sapiens</Link>
          <Link className="hover:text-yellow" href="/admin/teams">Teams</Link>
          <Link className="hover:text-yellow" href="/admin/goodies">Goodies</Link>
        </nav>
      </div>
      {children}
    </div>
  );
}
