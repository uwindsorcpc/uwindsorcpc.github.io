"use client";

import { useEffect, useState } from "react";

import { getBoard, type Board as BoardData } from "@/lib/attendance";

/** Live list of screen names for the open check-in. */
export function Board({ highlight }: { highlight?: string }) {
  const [board, setBoard] = useState<BoardData | null>(null);

  useEffect(() => {
    let active = true;
    const load = () =>
      getBoard()
        .then((b) => active && setBoard(b))
        .catch(() => {});
    load();
    const t = setInterval(load, 8000);
    return () => {
      active = false;
      clearInterval(t);
    };
    // Reload straight away when someone on this page has just checked in.
  }, [highlight]);

  if (!board?.event_id) return null;

  return (
    <section aria-labelledby="board" className="border-t-2 border-border pt-5">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="board" className="condensed text-2xl font-bold">
          Who&apos;s here
        </h2>
        <span className="text-sm text-muted">{board.count} checked in</span>
      </div>
      {board.entries.length === 0 ? (
        <p className="mt-4 text-muted">Nobody yet. Be the first!</p>
      ) : (
        <ul className="mt-4 flex flex-wrap gap-2">
          {board.entries.map((e, i) => (
            <li
              key={`${e.name}-${i}`}
              className={`rounded-md border px-3 py-1.5 text-sm ${
                e.name === highlight ? "border-accent bg-accent-soft text-fg" : "border-border bg-surface-2 text-fg"
              }`}
            >
              {e.name}
              {e.guest && <span className="ml-2 text-xs text-muted">guest</span>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
