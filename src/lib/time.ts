/**
 * Event times in /content are written in Windsor local time (America/Toronto).
 * These helpers turn them into real instants, so the countdown is correct
 * whatever time zone the visitor is in, including across daylight saving.
 */

/** The club's time zone. All event times are entered and shown in it. */
export const CLUB_TIMEZONE = "America/Toronto";

/** Offset in minutes between `timeZone` and UTC at the given instant. */
function tzOffsetMinutes(utcMs: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(utcMs));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return (asUtc - utcMs) / 60000;
}

/** "2026-12-03" + "18:00" in `timeZone` → milliseconds since epoch. */
export function zonedToUtcMs(date: string, time: string, timeZone: string): number {
  const [y, mo, d] = date.split("-").map(Number);
  const [h, mi] = time.split(":").map(Number);
  const naive = Date.UTC(y, mo - 1, d, h, mi);
  // Two passes handle the hour around a daylight-saving switch.
  let guess = naive - tzOffsetMinutes(naive, timeZone) * 60000;
  guess = naive - tzOffsetMinutes(guess, timeZone) * 60000;
  return guess;
}

export function formatEventDate(ms: number, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(ms));
}

export function formatEventTime(startMs: number, endMs: number, timeZone: string): string {
  const fmt = new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", minute: "2-digit" });
  const zone =
    new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "short" })
      .formatToParts(new Date(startMs))
      .find((p) => p.type === "timeZoneName")?.value ?? "";
  return `${fmt.format(new Date(startMs))} – ${fmt.format(new Date(endMs))} ${zone}`.replace(/ /g, " ");
}

/** "Dec" and "3" for the date badge on event cards. */
export function monthDayLabels(ms: number, timeZone: string): { monthLabel: string; dayLabel: string } {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, month: "short", day: "numeric" }).formatToParts(new Date(ms));
  return {
    monthLabel: parts.find((p) => p.type === "month")?.value ?? "",
    dayLabel: parts.find((p) => p.type === "day")?.value ?? "",
  };
}

/** Milliseconds → { date: "2026-12-03", time: "18:00" } in `timeZone` (for admin forms). */
export function utcMsToZoned(ms: number, timeZone: string): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(new Date(ms));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return { date: `${get("year")}-${get("month")}-${get("day")}`, time: `${get("hour")}:${get("minute")}` };
}
