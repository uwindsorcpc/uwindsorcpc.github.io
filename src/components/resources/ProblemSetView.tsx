"use client";

import { fetchProblems } from "@/lib/db/queries";
import type { Difficulty, Platform, ProblemsByPlatform } from "@/lib/db/types";
import { useLive } from "@/lib/db/useLive";
import { ExternalIcon } from "../icons";

const difficulties: { key: Difficulty; label: string; text: string; border: string }[] = [
  { key: "easy", label: "Easy", text: "text-easy", border: "border-t-easy" },
  { key: "medium", label: "Medium", text: "text-medium", border: "border-t-medium" },
  { key: "hard", label: "Hard", text: "text-hard", border: "border-t-hard" },
];

/** The club's hand-picked problems for one platform, by difficulty. Live from the database. */
export function ProblemSetView({ platform, initial }: { platform: Platform; initial: ProblemsByPlatform }) {
  const all = useLive(fetchProblems, initial);
  const sets = all[platform];
  const total = sets.easy.length + sets.medium.length + sets.hard.length;

  if (total === 0) {
    return <p className="border-y border-border py-8 text-muted">No problems added here yet. Check back soon.</p>;
  }

  return (
    <div className="grid gap-12 lg:grid-cols-3 lg:gap-10">
      {difficulties.map((d) => (
        <section key={d.key} aria-labelledby={d.key}>
          <div className={`border-t-4 ${d.border} pt-4 pb-5`}>
            <h3 id={d.key} className={`condensed scroll-mt-24 text-2xl font-bold ${d.text}`}>
              {d.label} <span className="text-base font-normal text-muted">({sets[d.key].length})</span>
            </h3>
          </div>
          {sets[d.key].length === 0 ? (
            <p className="border-y border-border py-4 text-sm text-muted">None yet.</p>
          ) : (
            <ol className="divide-y divide-border border-y border-border">
              {sets[d.key].map((p, i) => (
                <li key={p.id}>
                  <a href={p.url} target="_blank" rel="noopener noreferrer" className="group flex items-baseline gap-4 py-3">
                    <span className="condensed w-4 shrink-0 font-bold text-muted">{String.fromCharCode(65 + i)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium group-hover:text-accent group-hover:underline group-hover:underline-offset-4">
                        {p.name}
                      </span>
                      {p.topic && <span className="block text-sm text-muted">{p.topic}</span>}
                    </span>
                    <ExternalIcon className="size-3.5 shrink-0 self-center text-muted" />
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ol>
          )}
        </section>
      ))}
    </div>
  );
}
