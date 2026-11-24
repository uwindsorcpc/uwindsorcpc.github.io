"use client";

import Link from "next/link";

import { useNowEverySecond } from "@/lib/clock";
import { fetchEvents } from "@/lib/db/queries";
import type { ClubEvent } from "@/lib/db/types";
import { useLive } from "@/lib/db/useLive";
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
export function NextEvent({ events: initial, builtAt }: { events: ClubEvent[]; builtAt: number }) {
  const events = useLive(fetchEvents, initial);
  const liveNow = useNowEverySecond();
  const now = liveNow ?? builtAt;
  const next = events.find((e) => e.endMs > now);

  if (!next) {
    return (
      <div className="border-y border-border py-8">
        <p className="text-lg font-semibold">No events scheduled right now.</p>
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
    <div>
      <div className="border-b border-border pb-6">
        <p className="text-muted">{live ? "Happening now. Come join us." : "Starts in"}</p>
        {!live && (
          <div role="timer" aria-label={`Countdown to ${next.title}`} className="mt-2 flex flex-wrap gap-x-7 gap-y-2">
            {parts(next.startMs - now).map((p) => (
              <div key={p.label} className="flex items-baseline gap-1.5">
                <span className="headline text-6xl tabular-nums sm:text-7xl">
                  {liveNow === null ? "--" : String(p.value).padStart(2, "0")}
                </span>
                <span className="text-sm text-muted">{p.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <EventCard event={next} status={live ? "live" : undefined} />
    </div>
  );
}
