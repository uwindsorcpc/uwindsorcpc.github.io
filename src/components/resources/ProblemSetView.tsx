"use client";

import { useId, useMemo, useState } from "react";

import { fetchProblems } from "@/lib/db/queries";
import type { Difficulty, Platform, Problem, ProblemsByPlatform } from "@/lib/db/types";
import { useLive } from "@/lib/db/useLive";
import { ExternalIcon, SearchIcon } from "../icons";

const difficulties: { key: Difficulty; label: string; text: string; border: string }[] = [
  { key: "easy", label: "Easy", text: "text-easy", border: "border-t-easy" },
  { key: "medium", label: "Medium", text: "text-medium", border: "border-t-medium" },
  { key: "hard", label: "Hard", text: "text-hard", border: "border-t-hard" },
];

const RATING_LABEL: Record<Platform, string> = {
  kattis: "Kattis difficulty",
  codeforces: "Codeforces rating",
  leetcode: "Rating",
};

const control =
  "h-10 rounded-md border border-border bg-bg px-3 text-sm text-fg placeholder:text-muted/80 focus:border-accent focus:outline-none";

/** A, B, C … Z, then 27, 28 … */
const label = (i: number) => (i < 26 ? String.fromCharCode(65 + i) : String(i + 1));

const fmtRating = (r: number) => (Number.isInteger(r) ? String(r) : r.toFixed(1));

/** The club's hand-picked problems for one platform, by difficulty, with search. Live from the database. */
export function ProblemSetView({ platform, initial }: { platform: Platform; initial: ProblemsByPlatform }) {
  const all = useLive(fetchProblems, initial);
  const sets = all[platform];
  const id = useId();

  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty | "">("");
  const [tag, setTag] = useState("");
  const [minRating, setMinRating] = useState("");
  const [maxRating, setMaxRating] = useState("");

  const everything = useMemo(() => difficulties.flatMap((d) => sets[d.key]), [sets]);
  const total = everything.length;

  // Tags used on this page, most common first.
  const tags = useMemo(() => {
    const count = new Map<string, number>();
    for (const p of everything) for (const t of p.tags) count.set(t, (count.get(t) ?? 0) + 1);
    return [...count].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([t]) => t);
  }, [everything]);

  const ratings = everything.map((p) => p.rating).filter((r): r is number => r != null);
  const hasRatings = ratings.length > 0;
  const lo = hasRatings ? Math.min(...ratings) : 0;
  const hi = hasRatings ? Math.max(...ratings) : 0;

  const filtering = query.trim() !== "" || difficulty !== "" || tag !== "" || minRating !== "" || maxRating !== "";

  const matches = (p: Problem, d: Difficulty) => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    const haystack = [p.name, ...p.tags, d, p.rating == null ? "" : fmtRating(p.rating)].join(" ").toLowerCase();
    if (!words.every((w) => haystack.includes(w))) return false;
    if (tag && !p.tags.includes(tag)) return false;
    const min = minRating === "" ? null : Number(minRating);
    const max = maxRating === "" ? null : Number(maxRating);
    if ((min != null || max != null) && p.rating == null) return false;
    if (min != null && p.rating! < min) return false;
    if (max != null && p.rating! > max) return false;
    return true;
  };

  const clear = () => {
    setQuery("");
    setDifficulty("");
    setTag("");
    setMinRating("");
    setMaxRating("");
  };

  if (total === 0) {
    return <p className="border-y border-border py-8 text-muted">No problems added here yet. Check back soon.</p>;
  }

  // Keep each problem's letter from the full list, so "Easy C" means the same thing with or without a search.
  const columns = difficulties
    .filter((d) => difficulty === "" || d.key === difficulty)
    .map((d) => ({ ...d, items: sets[d.key].map((p, i) => ({ p, i })).filter(({ p }) => matches(p, d.key)) }));
  const shown = columns.reduce((n, c) => n + c.items.length, 0);

  const gridCols = columns.length === 3 ? "lg:grid-cols-3" : columns.length === 2 ? "lg:grid-cols-2" : "";

  return (
    <div>
      <form role="search" onSubmit={(e) => e.preventDefault()} className="mb-10 rounded-lg border border-border bg-surface p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="min-w-0 flex-1">
            <label htmlFor={`${id}-q`} className="mb-1.5 block text-sm font-medium">
              Search
            </label>
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
              <input
                id={`${id}-q`}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={hasRatings ? "Name, tag or rating, e.g. graphs or 1200" : "Name or tag, e.g. two pointers"}
                className={`${control} w-full pl-9`}
                autoComplete="off"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-end">
            <div>
              <label htmlFor={`${id}-d`} className="mb-1.5 block text-sm font-medium">
                Difficulty
              </label>
              <select
                id={`${id}-d`}
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty | "")}
                className={`${control} w-full sm:w-32`}
              >
                <option value="">All</option>
                {difficulties.map((d) => (
                  <option key={d.key} value={d.key}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor={`${id}-t`} className="mb-1.5 block text-sm font-medium">
                Tag
              </label>
              <select id={`${id}-t`} value={tag} onChange={(e) => setTag(e.target.value)} className={`${control} w-full sm:w-44`}>
                <option value="">All tags</option>
                {tags.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {hasRatings && (
              <fieldset className="col-span-2 sm:col-span-1">
                <legend className="mb-1.5 block text-sm font-medium">{RATING_LABEL[platform]}</legend>
                <div className="flex items-center gap-2">
                  <label htmlFor={`${id}-min`} className="sr-only">
                    Minimum rating
                  </label>
                  <input
                    id={`${id}-min`}
                    type="number"
                    inputMode="decimal"
                    step="any"
                    value={minRating}
                    onChange={(e) => setMinRating(e.target.value)}
                    placeholder={`Min ${fmtRating(lo)}`}
                    className={`${control} w-full sm:w-28`}
                  />
                  <span aria-hidden className="text-muted">
                    to
                  </span>
                  <label htmlFor={`${id}-max`} className="sr-only">
                    Maximum rating
                  </label>
                  <input
                    id={`${id}-max`}
                    type="number"
                    inputMode="decimal"
                    step="any"
                    value={maxRating}
                    onChange={(e) => setMaxRating(e.target.value)}
                    placeholder={`Max ${fmtRating(hi)}`}
                    className={`${control} w-full sm:w-28`}
                  />
                </div>
              </fieldset>
            )}
          </div>
        </div>

        <div className="mt-3 flex items-center gap-3 text-sm text-muted" aria-live="polite">
          <span>{filtering ? `Showing ${shown} of ${total} problems` : `${total} problems`}</span>
          {filtering && (
            <button type="button" onClick={clear} className="text-accent underline-offset-4 hover:underline">
              Clear filters
            </button>
          )}
        </div>
      </form>

      {filtering && shown === 0 ? (
        <p className="border-y border-border py-8 text-muted">
          No problems match.{" "}
          <button type="button" onClick={clear} className="text-accent underline-offset-4 hover:underline">
            Clear filters
          </button>
        </p>
      ) : (
        <div className={`grid gap-12 lg:gap-10 ${gridCols}`}>
          {columns.map((d) => (
            <section key={d.key} aria-labelledby={d.key}>
              <div className={`border-t-4 ${d.border} pt-4 pb-5`}>
                <h3 id={d.key} className={`condensed scroll-mt-24 text-2xl font-bold ${d.text}`}>
                  {d.label}{" "}
                  <span className="text-base font-normal text-muted">
                    ({filtering ? `${d.items.length} of ${sets[d.key].length}` : sets[d.key].length})
                  </span>
                </h3>
              </div>
              {d.items.length === 0 ? (
                <p className="border-y border-border py-4 text-sm text-muted">{filtering ? "No matches." : "None yet."}</p>
              ) : (
                <ol className="divide-y divide-border border-y border-border">
                  {d.items.map(({ p, i }) => (
                    <li key={p.id} className="flex gap-4 py-3">
                      <span className="condensed w-5 shrink-0 font-bold text-muted">{label(i)}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-3">
                          <a
                            href={p.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group min-w-0 flex-1 font-medium hover:text-accent hover:underline hover:underline-offset-4"
                          >
                            <span className="break-words">{p.name}</span>
                            <ExternalIcon className="ml-1.5 inline size-3.5 align-[-0.1em] text-muted" />
                            <span className="sr-only">(opens in a new tab)</span>
                          </a>
                          {p.rating != null && (
                            <span
                              className="shrink-0 rounded border border-border px-1.5 py-0.5 text-xs text-muted tabular-nums"
                              title={RATING_LABEL[platform]}
                            >
                              <span className="sr-only">{RATING_LABEL[platform]}: </span>
                              {fmtRating(p.rating)}
                            </span>
                          )}
                        </div>
                        {p.tags.length > 0 && (
                          <ul className="mt-1.5 flex flex-wrap gap-1.5" aria-label="Tags">
                            {p.tags.map((t) => (
                              <li key={t}>
                                <button
                                  type="button"
                                  onClick={() => setTag(tag === t ? "" : t)}
                                  aria-pressed={tag === t}
                                  className={`rounded px-1.5 py-0.5 text-xs transition-colors ${
                                    tag === t
                                      ? "bg-accent/15 text-accent"
                                      : "bg-fg/5 text-muted hover:bg-fg/10 hover:text-fg"
                                  }`}
                                >
                                  {t}
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
