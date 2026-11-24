"use client";

import { fetchPastContests, fetchProblems } from "@/lib/db/queries";
import type { Difficulty, PastContest, ProblemSets } from "@/lib/db/types";
import { useLive } from "@/lib/db/useLive";
import { ExternalIcon, TrophyIcon } from "../icons";
import { ExternalButton, SectionHeading } from "../ui";

const difficulties: { key: Difficulty; label: string; blurb: string; text: string; border: string }[] = [
  { key: "easy", label: "Easy", blurb: "Start here. Input/output, loops, conditionals and basic math.", text: "text-easy", border: "border-t-easy" },
  { key: "medium", label: "Medium", blurb: "Classic techniques: BFS/DFS, union-find, shortest paths, dynamic programming.", text: "text-medium", border: "border-t-medium" },
  { key: "hard", label: "Hard", blurb: "Regional-level topics: data structures, flows, geometry, string algorithms.", text: "text-hard", border: "border-t-hard" },
];

export function ContestsView({ contests: initialContests, problems: initialProblems }: { contests: PastContest[]; problems: ProblemSets }) {
  const contests = useLive(fetchPastContests, initialContests);
  const problemSets = useLive(fetchProblems, initialProblems);

  return (
    <>
      <section aria-labelledby="past-contests" className="mb-20">
        <SectionHeading id="past-contests" sub="Upsolve them: try the problems you didn't get during the contest.">
          Past club contests
        </SectionHeading>
        {contests.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-6 font-mono text-sm text-muted">No past contests yet. The first one is coming soon.</p>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {contests.map((c) => (
              <li key={c.id} className="flex flex-col rounded-xl border border-border bg-surface p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-xs text-muted">
                      <time dateTime={c.heldOn}>{c.dateLabel}</time>
                    </p>
                    <h3 className="mt-1 text-lg font-semibold">{c.title}</h3>
                  </div>
                  <span aria-hidden="true" className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
                    <TrophyIcon />
                  </span>
                </div>
                {c.description && <p className="mt-3 text-sm text-muted">{c.description}</p>}
                <dl className="mt-4 flex gap-6 font-mono text-sm">
                  {c.problems !== null && (
                    <div>
                      <dt className="text-xs text-muted">problems</dt>
                      <dd className="font-semibold">{c.problems}</dd>
                    </div>
                  )}
                  {c.participants !== null && (
                    <div>
                      <dt className="text-xs text-muted">participants</dt>
                      <dd className="font-semibold">{c.participants}</dd>
                    </div>
                  )}
                </dl>
                {c.kattisUrl && (
                  <div className="mt-5 pt-1">
                    <ExternalButton href={c.kattisUrl} variant="secondary">
                      View on Kattis
                    </ExternalButton>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="problems">
        <SectionHeading id="problems" sub="Hand-picked Kattis problems. Start with easy and move up when they start to feel routine.">
          Practice problems
        </SectionHeading>

        <nav aria-label="Difficulty" className="mb-8 flex flex-wrap gap-2">
          {difficulties.map((d) => (
            <a
              key={d.key}
              href={`#${d.key}`}
              className="rounded-lg border border-border bg-surface px-4 py-2 font-mono text-sm text-muted transition-colors hover:border-accent hover:text-fg"
            >
              {d.label} <span className="text-xs">({problemSets[d.key].length})</span>
            </a>
          ))}
        </nav>

        <div className="grid gap-6 lg:grid-cols-3">
          {difficulties.map((d) => (
            <section key={d.key} aria-labelledby={d.key} className="rounded-xl border border-border bg-surface">
              <div className={`rounded-t-xl border-t-4 ${d.border} p-6 pb-4`}>
                <h3 id={d.key} className={`scroll-mt-24 font-mono text-lg font-bold ${d.text}`}>
                  {d.label}
                </h3>
                <p className="mt-1 text-sm text-muted">{d.blurb}</p>
              </div>
              <ol className="divide-y divide-border border-t border-border">
                {problemSets[d.key].map((p, i) => (
                  <li key={p.id}>
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-3 px-6 py-3 transition-colors hover:bg-surface-2"
                    >
                      <span className="w-6 shrink-0 font-mono text-xs text-muted">{String(i + 1).padStart(2, "0")}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium group-hover:text-accent">{p.name}</span>
                        {p.topic && <span className="block font-mono text-xs text-muted">{p.topic}</span>}
                      </span>
                      <ExternalIcon className="size-3.5 shrink-0 text-muted" />
                      <span className="sr-only">(opens in a new tab)</span>
                    </a>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      </section>
    </>
  );
}
