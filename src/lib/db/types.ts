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
export type Problem = { id: string; name: string; url: string; topic: string | null };
export type ProblemSets = Record<Difficulty, Problem[]>;

export type Faq = { id: string; question: string; answer: string };
