/**
 * Public check-in and RSVP calls. Each one goes through a database function
 * that validates input and rate-limits (see supabase/migrations/0002_attendance.sql).
 */
import { publicDb } from "@/lib/supabase/clients";

export type OpenCheckin = { event_id: string; title: string; room: string; starts_at: string; ends_at: string };
export type BoardEntry = { name: string; guest: boolean };
export type Board = { event_id: string | null; count: number; entries: BoardEntry[] };

export type CheckinStatus = "accepted" | "already" | "not_member" | "closed" | "bad_ticket" | "too_many" | "busy";
export type RsvpStatus = "going" | "already" | "not_member" | "closed" | "busy";

/** Our own validation messages (SQL errcode 22023) are safe to show as-is. */
function friendlyError(error: { code?: string; message: string }): Error {
  return new Error(error.code === "22023" ? error.message : "Something went wrong. Please try again.");
}

export async function getOpenCheckin(): Promise<OpenCheckin | null> {
  const { data, error } = await publicDb.rpc("current_checkin");
  if (error) throw friendlyError(error);
  return data?.event_id ? (data as OpenCheckin) : null;
}

export async function startCheckin(code: string): Promise<{ status: "ok"; ticket: string } | { status: "wrong_code" | "closed" | "busy" }> {
  const { data, error } = await publicDb.rpc("start_checkin", { p_code: code });
  if (error) throw friendlyError(error);
  return data;
}

export async function submitCheckin(input: {
  ticket: string;
  fullName: string;
  email: string;
  displayName: string;
  asGuest: boolean;
}): Promise<{ status: CheckinStatus; display_name?: string; guest?: boolean }> {
  const { data, error } = await publicDb.rpc("submit_checkin", {
    p_ticket: input.ticket,
    p_full_name: input.fullName,
    p_email: input.email,
    p_display_name: input.displayName,
    p_as_guest: input.asGuest,
  });
  if (error) throw friendlyError(error);
  return data;
}

export async function getBoard(): Promise<Board> {
  const { data, error } = await publicDb.rpc("checkin_board");
  if (error) throw friendlyError(error);
  return data as Board;
}

export async function submitRsvp(input: { eventId: string; fullName: string; email: string; asGuest: boolean }): Promise<RsvpStatus> {
  const { data, error } = await publicDb.rpc("submit_rsvp", {
    p_event_id: input.eventId,
    p_full_name: input.fullName,
    p_email: input.email,
    p_as_guest: input.asGuest,
  });
  if (error) throw friendlyError(error);
  return data.status;
}

export async function getRsvpCounts(): Promise<Record<string, number>> {
  const { data, error } = await publicDb.rpc("rsvp_counts");
  if (error) throw friendlyError(error);
  return data ?? {};
}

/* ------------- hand-off to the Join page (kept out of the URL) ------------- */

const PREFILL_KEY = "cpc-prefill";
export type Prefill = { fullName: string; email: string; returnTo?: string; returnLabel?: string };

export function savePrefill(p: Prefill) {
  try {
    sessionStorage.setItem(PREFILL_KEY, JSON.stringify(p));
  } catch {
    /* storage blocked: the person just types their details again */
  }
}

export function readPrefill(): Prefill | null {
  try {
    const raw = sessionStorage.getItem(PREFILL_KEY);
    return raw ? (JSON.parse(raw) as Prefill) : null;
  } catch {
    return null;
  }
}

export function clearPrefill() {
  try {
    sessionStorage.removeItem(PREFILL_KEY);
  } catch {
    /* ignore */
  }
}

/* ------------------------------ calendar file ------------------------------ */

/** A one-event .ics file for "Add to calendar". */
export function icsFor(event: { id: string; title: string; room: string; startMs: number; endMs: number; description?: string | null }) {
  const stamp = (ms: number) => new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const esc = (s: string) => s.replace(/[\;,]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//CPC UWindsor//Events//EN",
    "BEGIN:VEVENT",
    `UID:${event.id}@uwindsorcpc.github.io`,
    `DTSTAMP:${stamp(Date.now())}`,
    `DTSTART:${stamp(event.startMs)}`,
    `DTEND:${stamp(event.endMs)}`,
    `SUMMARY:${esc(`CPC UWindsor: ${event.title}`)}`,
    `LOCATION:${esc(`${event.room}, University of Windsor`)}`,
    ...(event.description ? [`DESCRIPTION:${esc(event.description)}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
