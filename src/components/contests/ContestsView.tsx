"use client";

import { fetchPastContests } from "@/lib/db/queries";
import type { PastContest } from "@/lib/db/types";
import { useLive } from "@/lib/db/useLive";
import { ExternalIcon } from "../icons";
import { SectionHeading } from "../ui";

export function ContestsView({ contests: initialContests }: { contests: PastContest[] }) {
  const contests = useLive(fetchPastContests, initialContests);

  return (
    <>
      <section aria-labelledby="past-contests">
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

    </>
  );
}
