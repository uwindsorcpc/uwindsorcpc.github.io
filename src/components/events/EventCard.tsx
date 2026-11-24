import type { ReactNode } from "react";

import type { ClubEvent } from "@/lib/db/types";
import { ExternalIcon } from "../icons";
import { EventTypeBadge } from "./EventTypeBadge";

/** One event as an agenda row: the date on the left, details on the right. */
export function EventCard({ event, status, footer }: { event: ClubEvent; status?: "live" | "past"; footer?: ReactNode }) {
  return (
    <article className={`grid grid-cols-[3.75rem_1fr] gap-5 py-7 sm:grid-cols-[5rem_1fr] sm:gap-8 ${status === "past" ? "opacity-70" : ""}`}>
      <div aria-hidden="true" className="text-center leading-none">
        <span className="condensed block text-sm font-semibold text-muted">{event.monthLabel}</span>
        <span className="headline mt-1 block text-5xl sm:text-6xl">{event.dayLabel}</span>
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <EventTypeBadge type={event.type} />
          {status === "live" && (
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-easy">
              <span className="size-2 animate-pulse rounded-full bg-easy motion-reduce:animate-none" aria-hidden="true" />
              Happening now
            </span>
          )}
        </div>
        <h3 className="mt-2 text-xl font-semibold leading-snug sm:text-2xl">{event.title}</h3>
        <p className="mt-1.5 text-muted">
          <time dateTime={new Date(event.startMs).toISOString()}>{event.dateLabel}</time>, {event.timeLabel}
          <br />
          {event.room}
        </p>
        {event.description && <p className="mt-3 max-w-2xl leading-relaxed text-muted">{event.description}</p>}
        {event.kattisUrl && (
          <a
            href={event.kattisUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-accent underline decoration-accent/40 underline-offset-4 hover:decoration-accent"
          >
            Problems on Kattis <ExternalIcon className="size-3.5" />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        )}
        {footer && <div className="mt-4">{footer}</div>}
      </div>
    </article>
  );
}
