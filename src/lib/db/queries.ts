/**
 * Reads the public content from Supabase. Used twice:
 *   1. at build time, so every page ships as ready-made HTML (fast, indexable);
 *   2. in the browser right after load, so admin edits show up immediately.
 * Every query asks for published rows only.
 */
import { publicDb } from "@/lib/supabase/clients";
import { CLUB_TIMEZONE, formatEventDate, formatEventTime, monthDayLabels } from "@/lib/time";
import { DIFFICULTIES, type ClubEvent, type EventType, type Faq, type PastContest, type ProblemSets, type TeamMember } from "./types";

function fail(what: string, error: { message: string }): never {
  throw new Error(`Could not load ${what} from Supabase: ${error.message}`);
}

export async function fetchEvents(): Promise<ClubEvent[]> {
  const { data, error } = await publicDb
    .from("events")
    .select("id, title, starts_at, ends_at, room, type, description, kattis_url")
    .eq("published", true)
    .order("starts_at");
  if (error) fail("events", error);
  return data.map((r) => {
    const startMs = Date.parse(r.starts_at);
    const endMs = Date.parse(r.ends_at);
    return {
      id: r.id,
      title: r.title,
      type: r.type as EventType,
      room: r.room,
      description: r.description,
      kattisUrl: r.kattis_url,
      startMs,
      endMs,
      dateLabel: formatEventDate(startMs, CLUB_TIMEZONE),
      timeLabel: formatEventTime(startMs, endMs, CLUB_TIMEZONE),
      ...monthDayLabels(startMs, CLUB_TIMEZONE),
    };
  });
}

export async function fetchTeam(): Promise<TeamMember[]> {
  const { data, error } = await publicDb
    .from("team_members")
    .select("id, name, role, bio, photo_url, links")
    .eq("published", true)
    .order("sort_order")
    .order("created_at");
  if (error) fail("team members", error);
  return data.map((r) => ({ id: r.id, name: r.name, role: r.role, bio: r.bio, photoUrl: r.photo_url, links: r.links ?? {} }));
}

export async function fetchPastContests(): Promise<PastContest[]> {
  const { data, error } = await publicDb
    .from("past_contests")
    .select("id, title, held_on, problems, participants, description, kattis_url")
    .eq("published", true)
    .order("held_on", { ascending: false });
  if (error) fail("past contests", error);
  return data.map((r) => ({
    id: r.id,
    title: r.title,
    heldOn: r.held_on,
    // Noon avoids the date shifting across time zones.
    dateLabel: formatEventDate(Date.parse(`${r.held_on}T12:00:00Z`), CLUB_TIMEZONE),
    problems: r.problems,
    participants: r.participants,
    description: r.description,
    kattisUrl: r.kattis_url,
  }));
}

export async function fetchProblems(): Promise<ProblemSets> {
  const { data, error } = await publicDb
    .from("problems")
    .select("id, name, url, topic, difficulty")
    .eq("published", true)
    .order("sort_order")
    .order("created_at");
  if (error) fail("problems", error);
  const sets = Object.fromEntries(DIFFICULTIES.map((d) => [d, []])) as unknown as ProblemSets;
  for (const r of data) sets[r.difficulty as keyof ProblemSets]?.push({ id: r.id, name: r.name, url: r.url, topic: r.topic });
  return sets;
}

export async function fetchFaqs(): Promise<Faq[]> {
  const { data, error } = await publicDb
    .from("faqs")
    .select("id, question, answer")
    .eq("published", true)
    .order("sort_order")
    .order("created_at");
  if (error) fail("FAQ", error);
  return data;
}
