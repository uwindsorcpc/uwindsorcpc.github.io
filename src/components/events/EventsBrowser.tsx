"use client";

import { useState } from "react";

import { useNowEveryMinute } from "@/lib/clock";
import { fetchEvents } from "@/lib/db/queries";
import type { ClubEvent, EventType } from "@/lib/db/types";
import { useLive } from "@/lib/db/useLive";
import { SectionHeading } from "../ui";
import { EventCard } from "./EventCard";

const FILTERS: ("all" | EventType)[] = ["all", "practice", "contest", "workshop"];

/**
 * Splits events into upcoming and past using the visitor's clock, so the page
 * stays correct between deploys. `builtAt` is used for the static HTML.
 */
export function EventsBrowser({ events: initial, builtAt }: { events: ClubEvent[]; builtAt: number }) {
  const events = useLive(fetchEvents, initial);
  const now = useNowEveryMinute() ?? builtAt;
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");

  const shown = filter === "all" ? events : events.filter((e) => e.type === filter);
  const upcoming = shown.filter((e) => e.endMs > now);
  const past = shown.filter((e) => e.endMs <= now).reverse();

  return (
    <>
      <div role="group" aria-label="Filter events by type" className="mb-10 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
            className="rounded-lg border border-border bg-surface px-4 py-2 font-mono text-sm capitalize text-muted transition-colors hover:text-fg aria-pressed:border-accent aria-pressed:bg-accent-soft aria-pressed:text-fg"
          >
            {f}
          </button>
        ))}
      </div>

      <section aria-labelledby="upcoming" className="mb-16">
        <SectionHeading id="upcoming">Upcoming</SectionHeading>
        {upcoming.length ? (
          <ul className="grid gap-4">
            {upcoming.map((e) => (
              <li key={e.id}>
                <EventCard event={e} status={e.startMs <= now ? "live" : undefined} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-xl border border-dashed border-border p-6 font-mono text-sm text-muted">
            No upcoming {filter === "all" ? "events" : `${filter} events`} scheduled yet. Check Discord for announcements.
          </p>
        )}
      </section>

      <section aria-labelledby="past">
        <SectionHeading id="past">Past events</SectionHeading>
        {past.length ? (
          <ul className="grid gap-4">
            {past.map((e) => (
              <li key={e.id}>
                <EventCard event={e} status="past" />
              </li>
            ))}
          </ul>
        ) : (
          <p className="font-mono text-sm text-muted">Nothing here yet.</p>
        )}
      </section>
    </>
  );
}
