import type { ClubEvent } from "@/lib/db/types";
import { ClockIcon, ExternalIcon, PinIcon } from "../icons";
import { EventTypeBadge } from "./EventTypeBadge";

export function EventCard({ event, status }: { event: ClubEvent; status?: "live" | "past" }) {
  return (
    <article
      className={`flex gap-5 rounded-xl border bg-surface p-5 sm:p-6 ${status === "live" ? "border-accent" : "border-border"} ${status === "past" ? "opacity-80" : ""}`}
    >
      <div
        aria-hidden="true"
        className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-lg border border-border bg-surface-2 font-mono"
      >
        <span className="text-xs uppercase text-accent">{event.monthLabel}</span>
        <span className="text-2xl font-bold leading-none">{event.dayLabel}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <EventTypeBadge type={event.type} />
          {status === "live" && (
            <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-accent">
              <span className="size-2 animate-pulse rounded-full bg-accent motion-reduce:animate-none" aria-hidden="true" />
              Happening now
            </span>
          )}
        </div>
        <h3 className="mt-2 text-lg font-semibold leading-snug">{event.title}</h3>
        <dl className="mt-2 flex flex-col gap-1 text-sm text-muted sm:flex-row sm:flex-wrap sm:gap-x-5">
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">Date and time</dt>
            <ClockIcon className="size-4 shrink-0" />
            <dd>
              <time dateTime={new Date(event.startMs).toISOString()}>{event.dateLabel}</time> · {event.timeLabel}
            </dd>
          </div>
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">Room</dt>
            <PinIcon className="size-4 shrink-0" />
            <dd>{event.room}</dd>
          </div>
        </dl>
        {event.description && <p className="mt-3 text-sm text-muted">{event.description}</p>}
        {event.kattisUrl && (
          <a
            href={event.kattisUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 font-mono text-sm text-accent underline decoration-accent/40 underline-offset-4 hover:decoration-accent"
          >
            Open on Kattis <ExternalIcon className="size-3.5" />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        )}
      </div>
    </article>
  );
}
