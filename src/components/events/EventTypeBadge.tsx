import type { EventType } from "@/lib/db/types";

const dot: Record<EventType, string> = {
  practice: "bg-practice",
  contest: "bg-contest",
  workshop: "bg-workshop",
};

const label: Record<EventType, string> = {
  practice: "Practice",
  contest: "Contest",
  workshop: "Workshop",
};

export function EventTypeBadge({ type }: { type: EventType }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-muted">
      <span aria-hidden="true" className={`size-2 rounded-full ${dot[type]}`} />
      {label[type]}
    </span>
  );
}
