"use client";

import { fetchPastContests, fetchProblems } from "@/lib/db/queries";
import type { Difficulty, PastContest, ProblemSets } from "@/lib/db/types";
import { useLive } from "@/lib/db/useLive";
import { ExternalIcon } from "../icons";
import { SectionHeading } from "../ui";

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
      <section aria-labelledby="past-contests" className="mb-24">
        <SectionHeading id="past-contests" sub="Every past contest stays open on Kattis. Upsolve the problems you didn't get during the contest.">
          Past club contests
        </SectionHeading>
        {contests.length === 0 ? (
          <p className="border-y border-border py-8 text-muted">No past contests yet. The first one is coming soon.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] border-y border-border text-left">
              <thead className="text-sm text-muted">
                <tr className="border-b border-border">
                  <th scope="col" className="py-3 pr-6 font-medium">Contest</th>
                  <th scope="col" className="py-3 pr-6 font-medium">Date</th>
                  <th scope="col" className="py-3 pr-6 text-right font-medium">Problems</th>
                  <th scope="col" className="py-3 pr-6 text-right font-medium">Participants</th>
                  <th scope="col" className="py-3 font-medium">
                    <span className="sr-only">Link</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {contests.map((c) => (
                  <tr key={c.id} className="align-top">
                    <td className="py-5 pr-6">
                      <p className="text-lg font-semibold">{c.title}</p>
                      {c.description && <p className="mt-1 max-w-md text-sm leading-relaxed text-muted">{c.description}</p>}
                    </td>
                    <td className="py-5 pr-6 whitespace-nowrap text-muted">
                      <time dateTime={c.heldOn}>{c.dateLabel}</time>
                    </td>
                    <td className="headline py-5 pr-6 text-right text-3xl tabular-nums">{c.problems ?? "–"}</td>
                    <td className="headline py-5 pr-6 text-right text-3xl tabular-nums">{c.participants ?? "–"}</td>
                    <td className="py-5 text-right whitespace-nowrap">
                      {c.kattisUrl && (
                        <a
                          href={c.kattisUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-accent underline decoration-accent/40 underline-offset-4 hover:decoration-accent"
                        >
                          Kattis <ExternalIcon className="size-3.5" />
                          <span className="sr-only">(opens in a new tab)</span>
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section aria-labelledby="problems">
        <SectionHeading id="problems" sub="Hand-picked Kattis problems. Start with easy and move up when they start to feel routine.">
          Practice problems
        </SectionHeading>

        <div className="grid gap-12 lg:grid-cols-3 lg:gap-10">
          {difficulties.map((d) => (
            <section key={d.key} aria-labelledby={d.key}>
              <div className={`border-t-4 ${d.border} pt-4 pb-5`}>
                <h3 id={d.key} className={`condensed scroll-mt-24 text-2xl font-bold ${d.text}`}>
                  {d.label}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">{d.blurb}</p>
              </div>
              <ol className="divide-y divide-border border-y border-border">
                {problemSets[d.key].map((p, i) => (
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
            </section>
          ))}
        </div>
      </section>
    </>
  );
}
