import type { EventType } from "@/lib/db/types";

const styles: Record<EventType, string> = {
  practice: "text-practice border-practice/40 bg-practice/10",
  contest: "text-contest border-contest/40 bg-contest/10",
  workshop: "text-workshop border-workshop/40 bg-workshop/10",
};

export function EventTypeBadge({ type }: { type: EventType }) {
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-xs font-medium uppercase tracking-wide ${styles[type]}`}>
      {type}
    </span>
  );
}
