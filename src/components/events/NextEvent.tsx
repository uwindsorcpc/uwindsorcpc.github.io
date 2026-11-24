"use client";

import Link from "next/link";

import type { ClubEvent } from "@/lib/content";
import { useNowEverySecond } from "@/lib/clock";
import { EventCard } from "./EventCard";

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return [
    { label: "days", value: Math.floor(s / 86400) },
    { label: "hrs", value: Math.floor((s % 86400) / 3600) },
    { label: "min", value: Math.floor((s % 3600) / 60) },
    { label: "sec", value: s % 60 },
  ];
}

/** Home page card: the next event plus a live countdown to its start. */
export function NextEvent({ events, builtAt }: { events: ClubEvent[]; builtAt: number }) {
  const liveNow = useNowEverySecond();
  const now = liveNow ?? builtAt;
  const next = events.find((e) => e.endMs > now);

  if (!next) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center">
        <p className="font-mono text-muted">No events scheduled right now.</p>
        <p className="mt-2 text-sm text-muted">
          Join the Discord to hear about the next one first, or browse{" "}
          <Link href="/events#past" className="text-accent underline underline-offset-4">
            past events
          </Link>
          .
        </p>
      </div>
    );
  }

  const live = next.startMs <= now;

  return (
    <div className="grid gap-4">
      <div className="rounded-xl border border-border bg-surface-2 p-5 sm:p-6">
        <p className="font-mono text-sm text-muted">
          <span className="text-accent">&gt;</span> {live ? "happening now" : "starts in"}
        </p>
        {live ? (
          <p className="mt-3 font-mono text-3xl font-bold text-accent">It&apos;s on. Come join us.</p>
        ) : (
          <div role="timer" aria-label={`Countdown to ${next.title}`} className="mt-3 grid grid-cols-4 gap-2 sm:gap-3">
            {parts(next.startMs - now).map((p) => (
              <div key={p.label} className="rounded-lg border border-border bg-surface px-2 py-3 text-center">
                <span className="block font-mono text-3xl font-bold tabular-nums sm:text-4xl">
                  {liveNow === null ? "--" : String(p.value).padStart(2, "0")}
                </span>
                <span className="mt-1 block font-mono text-xs uppercase tracking-wider text-muted">{p.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <EventCard event={next} status={live ? "live" : undefined} />
    </div>
  );
}
