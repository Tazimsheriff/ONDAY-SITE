"use client";

import Link from "next/link";
import { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const [pressed, setPressed] = useState(false);

  useEffect(() => {
    setPressed(false);
  }, [pathname]);

  return (
    <Link
      href={href}
      onClick={() => {
        if (pathname !== href) setPressed(true);
      }}
      className="inline-flex min-h-11 items-center sm:min-h-0"
      aria-current={pathname === href ? "page" : undefined}
    >
      <NavFace pressed={pressed}>{children}</NavFace>
    </Link>
  );
}

function NavFace({ pressed, children }: { pressed: boolean; children: React.ReactNode }) {
  const { pending } = useLinkStatus();
  const loading = pressed || pending;

  return (
    <span
      aria-busy={loading}
      className={
        loading
          ? "inline-flex items-center gap-1.5 border-[1.6px] border-ink bg-ink px-2.5 py-1 text-sm font-bold text-cream shadow-[2px_2px_0_#b6eaff]"
          : "underline-offset-4 hover:underline"
      }
    >
      {children}
      {loading ? (
        <>
          <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-yellow" aria-hidden="true" />
          <span className="sr-only">Loading</span>
        </>
      ) : null}
    </span>
  );
}
