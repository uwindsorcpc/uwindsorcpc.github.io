/** Shapes of the data the public pages render. */

export const EVENT_TYPES = ["practice", "contest", "workshop"] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export type ClubEvent = {
  id: string;
  title: string;
  type: EventType;
  room: string;
  description: string | null;
  kattisUrl: string | null;
  startMs: number;
  endMs: number;
  dateLabel: string;
  timeLabel: string;
  monthLabel: string;
  dayLabel: string;
};

export const TEAM_LINK_KEYS = ["github", "linkedin", "codeforces", "kattis", "website", "email"] as const;
export type TeamLinkKey = (typeof TEAM_LINK_KEYS)[number];
export type TeamLinks = Partial<Record<TeamLinkKey, string>>;

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  bio: string | null;
  photoUrl: string | null;
  links: TeamLinks;
};

export type PastContest = {
  id: string;
  title: string;
  heldOn: string;
  dateLabel: string;
  problems: number | null;
  participants: number | null;
  description: string | null;
  kattisUrl: string | null;
};

export const DIFFICULTIES = ["easy", "medium", "hard"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];
export type Problem = {
  id: string;
  name: string;
  url: string;
  /** Tags, split from the comma-separated "topic" column. */
  tags: string[];
  /** The platform's own rating: Kattis difficulty (e.g. 2.4) or Codeforces rating (e.g. 1200). */
  rating: number | null;
};
export type ProblemSets = Record<Difficulty, Problem[]>;

/** Practice platforms with their own page under /resources. */
export const PLATFORMS = ["kattis", "codeforces", "leetcode"] as const;
export type Platform = (typeof PLATFORMS)[number];

/** A problem's platform, worked out from its link (no extra field to fill in). */
export function platformOf(url: string): Platform | null {
  let host = "";
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
  if (host === "kattis.com" || host.endsWith(".kattis.com")) return "kattis";
  if (host === "codeforces.com" || host.endsWith(".codeforces.com")) return "codeforces";
  if (host === "leetcode.com" || host.endsWith(".leetcode.com")) return "leetcode";
  return null;
}

/** All problems, split by platform and then by difficulty. */
export type ProblemsByPlatform = Record<Platform, ProblemSets>;

export type Faq = { id: string; question: string; answer: string };
