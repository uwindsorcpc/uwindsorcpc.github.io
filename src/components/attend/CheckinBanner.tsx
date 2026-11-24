"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { getOpenCheckin, type OpenCheckin } from "@/lib/attendance";

/** Thin bar on every page while an event's check-in is open. */
export function CheckinBanner() {
  const pathname = usePathname();
  const [open, setOpen] = useState<OpenCheckin | null>(null);

  useEffect(() => {
    let active = true;
    getOpenCheckin()
      .then((c) => active && setOpen(c))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  if (!open || pathname === "/attend") return null;

  return (
    <div className="border-b border-accent/40 bg-accent-soft px-4 py-2 text-center text-sm">
      <span aria-hidden="true" className="mr-2 inline-block size-2 animate-pulse rounded-full bg-accent motion-reduce:animate-none" />
      Check-in is open for <strong>{open.title}</strong>.{" "}
      <Link href="/attend" className="font-mono font-semibold text-accent underline underline-offset-4">
        Check in →
      </Link>
    </div>
  );
}
