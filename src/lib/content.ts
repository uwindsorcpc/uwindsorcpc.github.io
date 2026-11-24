/**
 * Loads and checks everything in /content. Pages import from here, never from
 * /content directly, so a typo in a JSON file fails the build with a clear
 * message instead of shipping a broken page.
 */
import fs from "node:fs";
import path from "node:path";
import { marked } from "marked";

import siteJson from "@content/site.json";
import eventsJson from "@content/events.json";
import teamJson from "@content/team.json";
import faqJson from "@content/faq.json";
import contestsJson from "@content/contests.json";
import resourcesJson from "@content/resources.json";

import { formatEventDate, formatEventTime, zonedToUtcMs } from "./time";

const CONTENT_DIR = path.join(process.cwd(), "content");

/* ---------------------------------- site ---------------------------------- */

export type SocialIcon = "discord" | "instagram" | "github" | "linkedin" | "email" | "website";

export const site = siteJson as {
  showSampleContentBanner: boolean;
  name: string;
  fullName: string;
  url: string;
  description: string;
  email: string;
  googleFormUrl: string;
  discordUrl: string;
  socials: { label: string; icon: SocialIcon; url: string }[];
  home: {
    headline: string;
    pitch: string;
    highlights: { title: string; command: string; text: string }[];
  };
};

export { isPlaceholder } from "./placeholder";

/* --------------------------------- events --------------------------------- */

export const EVENT_TYPES = ["practice", "contest", "workshop"] as const;
export type EventType = (typeof EVENT_TYPES)[number];

type RawEvent = {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  room: string;
  type: string;
  description?: string;
  kattisUrl?: string;
};

/** An event ready to render: times resolved and labels pre-formatted. */
export type ClubEvent = Omit<RawEvent, "type"> & {
  type: EventType;
  startMs: number;
  endMs: number;
  dateLabel: string;
  timeLabel: string;
  monthLabel: string;
  dayLabel: string;
};

const TIMEZONE = eventsJson.timezone;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function checkEvent(e: RawEvent): ClubEvent {
  const where = `content/events.json → "${e.title ?? e.id}"`;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(e.date)) throw new Error(`${where}: date must look like 2026-12-03`);
  for (const t of [e.startTime, e.endTime]) {
    if (!/^\d{2}:\d{2}$/.test(t)) throw new Error(`${where}: times must be 24-hour HH:MM, like 18:00`);
  }
  if (!EVENT_TYPES.includes(e.type as EventType)) {
    throw new Error(`${where}: type must be one of ${EVENT_TYPES.join(", ")}`);
  }
  const startMs = zonedToUtcMs(e.date, e.startTime, TIMEZONE);
  const endMs = zonedToUtcMs(e.date, e.endTime, TIMEZONE);
  if (endMs <= startMs) throw new Error(`${where}: endTime must be after startTime`);
  return {
    ...e,
    type: e.type as EventType,
    startMs,
    endMs,
    dateLabel: formatEventDate(startMs, TIMEZONE),
    timeLabel: formatEventTime(startMs, endMs, TIMEZONE),
    monthLabel: MONTHS[Number(e.date.slice(5, 7)) - 1],
    dayLabel: String(Number(e.date.slice(8, 10))),
  };
}

/** All events, soonest first. Upcoming/past is decided in the browser. */
export const events: ClubEvent[] = (eventsJson.events as RawEvent[])
  .map(checkEvent)
  .sort((a, b) => a.startMs - b.startMs);

/* ---------------------------------- team ---------------------------------- */

export type TeamLinks = Partial<Record<"github" | "linkedin" | "codeforces" | "kattis" | "website" | "email", string>>;
export type TeamMember = { name: string; role: string; bio?: string; photo?: string; links?: TeamLinks };
export const team = teamJson.members as TeamMember[];

/* ------------------------------ faq, contests ----------------------------- */

export const faq = faqJson.questions as { q: string; a: string }[];

export type Difficulty = "easy" | "medium" | "hard";
export type Problem = { name: string; url: string; topic?: string };
export type PastContest = {
  title: string;
  date: string;
  problems?: number;
  participants?: number;
  description?: string;
  kattisUrl?: string;
};

export const pastContests = (contestsJson.pastContests as PastContest[])
  .map((c) => ({ ...c, dateLabel: formatEventDate(zonedToUtcMs(c.date, "12:00", TIMEZONE), TIMEZONE) }))
  .sort((a, b) => b.date.localeCompare(a.date));

export const problemSets = contestsJson.problemSets as Record<Difficulty, Problem[]>;

/* -------------------------------- resources ------------------------------- */

export type LinkItem = { label: string; url: string };
export const resources = resourcesJson as {
  roadmap: { title: string; duration?: string; text: string; links?: LinkItem[] }[];
  platforms: { name: string; url: string; text: string }[];
  books: { name: string; author?: string; url: string; text: string }[];
};

export function readTemplate(file: "template.cpp" | "template.py"): string {
  return fs.readFileSync(path.join(CONTENT_DIR, "templates", file), "utf8");
}

/* --------------------------------- markdown ------------------------------- */

/** Renders a Markdown file from /content to HTML (content is written by the execs). */
export function readMarkdown(file: string): string {
  const md = fs.readFileSync(path.join(CONTENT_DIR, file), "utf8").replace(/<!--[\s\S]*?-->/g, "");
  return marked.parse(md, { async: false });
}
