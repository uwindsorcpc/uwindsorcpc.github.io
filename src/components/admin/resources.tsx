"use client";

import type { ReactNode } from "react";

import { CLUB_TIMEZONE, formatEventDate, utcMsToZoned, zonedToUtcMs } from "@/lib/time";
import { TEAM_LINK_KEYS, platformOf } from "@/lib/db/types";
import type { FieldDef, FormValues } from "./fields";

export type Row = Record<string, unknown> & { id: string };

export type ResourceDef = {
  key: string;
  title: string;
  singular: string;
  table: string;
  select: string;
  order: { column: string; ascending?: boolean }[];
  fields: FieldDef[];
  columns: { label: string; render: (row: Row) => ReactNode }[];
  /** Short name used in "Delete …?" prompts. */
  describe: (row: Row) => string;
  toForm?: (row: Row | null) => FormValues;
  fromForm?: (values: FormValues) => Record<string, unknown>;
  canCreate?: boolean;
  searchText?: (row: Row) => string;
  csv?: boolean;
};

/* ------------------------------ generic mapping ----------------------------- */

const s = (v: unknown) => (typeof v === "string" ? v : v === null || v === undefined ? "" : String(v));

export function defaultToForm(fields: FieldDef[], row: Row | null): FormValues {
  const out: FormValues = {};
  for (const f of fields) {
    const v = row?.[f.name];
    if (f.kind === "checkbox") out[f.name] = row ? v === true : true;
    else if (f.kind === "links") out[f.name] = (v as Record<string, string>) ?? {};
    else if (!row && f.name === "sort_order") out[f.name] = "0";
    else out[f.name] = s(v);
  }
  return out;
}

export function defaultFromForm(fields: FieldDef[], values: FormValues): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    const v = values[f.name];
    if (f.kind === "checkbox") out[f.name] = v === true;
    else if (f.kind === "number") out[f.name] = s(v).trim() === "" ? null : Number(v);
    else if (f.kind === "links") {
      const links: Record<string, string> = {};
      for (const k of TEAM_LINK_KEYS) {
        const val = s((v as Record<string, string>)[k]).trim();
        if (!val) continue;
        if (k !== "email" && !/^https:\/\//i.test(val)) throw new Error(`${k} link must start with https://`);
        links[k] = val;
      }
      out[f.name] = links;
    } else {
      const t = s(v).trim();
      if ((f.kind === "url" || f.kind === "photo") && t && !/^https:\/\//i.test(t)) {
        throw new Error(`${f.label} must start with https://`);
      }
      out[f.name] = t === "" ? null : t;
    }
  }
  return out;
}

/* --------------------------------- helpers --------------------------------- */

const PLATFORM_NAMES = { kattis: "Kattis", codeforces: "Codeforces", leetcode: "LeetCode" } as const;
const platformLabel = (url: string) => {
  const p = platformOf(url);
  return p ? PLATFORM_NAMES[p] : <span className="text-hard">Not shown (unknown site)</span>;
};

const published = (row: Row) =>
  row.published ? (
    <span className="font-mono text-xs text-easy">live</span>
  ) : (
    <span className="font-mono text-xs text-muted">draft</span>
  );
const publishedField: FieldDef = { name: "published", label: "Published (visible on the site)", kind: "checkbox" };
const orderField: FieldDef = { name: "sort_order", label: "Order", kind: "number", help: "Lower numbers show first." };
const dateOnly = (iso: unknown) => formatEventDate(Date.parse(`${s(iso)}T12:00:00Z`), CLUB_TIMEZONE);

/* -------------------------------- resources -------------------------------- */

const eventFields: FieldDef[] = [
  { name: "title", label: "Title", kind: "text", required: true, maxLength: 200, wide: true },
  { name: "date", label: "Date", kind: "date", required: true },
  { name: "type", label: "Type", kind: "select", required: true, options: [["practice", "Practice"], ["contest", "Contest"], ["workshop", "Workshop"]] },
  { name: "start_time", label: "Starts (Windsor time)", kind: "time", required: true },
  { name: "end_time", label: "Ends (Windsor time)", kind: "time", required: true },
  { name: "room", label: "Room", kind: "text", required: true, maxLength: 100 },
  { name: "kattis_url", label: "Kattis link", kind: "url", help: "Optional." },
  { name: "description", label: "Description", kind: "textarea", maxLength: 2000, wide: true },
  publishedField,
];

export const RESOURCES: ResourceDef[] = [
  {
    key: "events",
    title: "Events",
    singular: "event",
    table: "events",
    select: "*",
    order: [{ column: "starts_at", ascending: false }],
    fields: eventFields,
    columns: [
      { label: "Date", render: (r) => formatEventDate(Date.parse(s(r.starts_at)), CLUB_TIMEZONE) },
      { label: "Title", render: (r) => s(r.title) },
      { label: "Type", render: (r) => <span className="font-mono text-xs uppercase">{s(r.type)}</span> },
      { label: "Status", render: published },
      {
        label: "Event",
        render: (r) => (
          <a
            href={`/admin/present?event=${r.id}`}
            target="_blank"
            rel="noopener"
            className="whitespace-nowrap font-mono text-xs text-accent underline underline-offset-4"
          >
            Run event ↗
          </a>
        ),
      },
    ],
    describe: (r) => s(r.title),
    toForm: (row): FormValues => {
      if (!row) return { title: "", date: "", type: "practice", start_time: "18:00", end_time: "20:00", room: "", kattis_url: "", description: "", published: true };
      const start = utcMsToZoned(Date.parse(s(row.starts_at)), CLUB_TIMEZONE);
      const end = utcMsToZoned(Date.parse(s(row.ends_at)), CLUB_TIMEZONE);
      return { ...defaultToForm(eventFields, row), date: start.date, start_time: start.time, end_time: end.time };
    },
    fromForm: (v) => {
      const base = defaultFromForm(eventFields, v);
      const startMs = zonedToUtcMs(s(v.date), s(v.start_time), CLUB_TIMEZONE);
      const endMs = zonedToUtcMs(s(v.date), s(v.end_time), CLUB_TIMEZONE);
      if (!(endMs > startMs)) throw new Error("The end time must be after the start time.");
      delete base.date;
      delete base.start_time;
      delete base.end_time;
      return { ...base, starts_at: new Date(startMs).toISOString(), ends_at: new Date(endMs).toISOString() };
    },
  },
  {
    key: "members",
    title: "Members",
    singular: "member",
    table: "members",
    select: "*",
    order: [{ column: "created_at", ascending: false }],
    canCreate: false,
    csv: true,
    fields: [
      { name: "full_name", label: "Full name", kind: "text", required: true, maxLength: 100 },
      { name: "email", label: "Email", kind: "email", required: true, maxLength: 254 },
      { name: "program", label: "Program", kind: "text", maxLength: 100 },
      { name: "year_of_study", label: "Year", kind: "select", options: [["1", "1st"], ["2", "2nd"], ["3", "3rd"], ["4", "4th"], ["5+", "5th+"], ["grad", "Graduate"], ["other", "Other"]] },
      { name: "experience", label: "Experience", kind: "select", required: true, options: [["none", "None"], ["beginner", "Beginner"], ["intermediate", "Intermediate"], ["advanced", "Advanced"]] },
      { name: "codeforces_handle", label: "Codeforces handle", kind: "text", maxLength: 24 },
      { name: "status", label: "Status", kind: "select", required: true, options: [["new", "New"], ["active", "Active"], ["inactive", "Inactive"]] },
      { name: "notes", label: "Private notes (admins only)", kind: "textarea", maxLength: 2000, wide: true },
    ],
    columns: [
      { label: "Joined", render: (r) => dateOnly(s(r.created_at).slice(0, 10)) },
      { label: "Name", render: (r) => s(r.full_name) },
      { label: "Email", render: (r) => <span className="font-mono text-xs">{s(r.email)}</span> },
      { label: "Program / year", render: (r) => [s(r.program), s(r.year_of_study)].filter(Boolean).join(" · ") },
      { label: "Experience", render: (r) => s(r.experience) },
      { label: "Status", render: (r) => <span className="font-mono text-xs">{s(r.status)}</span> },
    ],
    describe: (r) => `${s(r.full_name)} (${s(r.email)})`,
    searchText: (r) => [r.full_name, r.email, r.program, r.codeforces_handle, r.notes].map(s).join(" ").toLowerCase(),
  },
  {
    key: "attendance",
    title: "Attendance",
    singular: "check-in",
    table: "attendance",
    select: "*, events(title)",
    order: [{ column: "checked_in_at", ascending: false }],
    canCreate: false,
    csv: true,
    fields: [
      { name: "full_name", label: "Full name", kind: "text", required: true, maxLength: 100 },
      { name: "email", label: "Email", kind: "email", required: true, maxLength: 254 },
      { name: "display_name", label: "Shown on screen as", kind: "text", required: true, maxLength: 30 },
      { name: "hidden", label: "Hidden from the public board", kind: "checkbox" },
    ],
    columns: [
      { label: "Event", render: (r) => s((r.events as { title?: string } | null)?.title) },
      { label: "Checked in", render: (r) => new Date(s(r.checked_in_at)).toLocaleString("en-CA", { timeZone: CLUB_TIMEZONE, dateStyle: "medium", timeStyle: "short" }) },
      { label: "Name", render: (r) => s(r.full_name) },
      { label: "Email", render: (r) => <span className="font-mono text-xs">{s(r.email)}</span> },
      { label: "On screen", render: (r) => <span className={r.hidden ? "line-through opacity-60" : ""}>{s(r.display_name)}</span> },
      { label: "Type", render: (r) => <span className="font-mono text-xs">{r.is_guest ? "guest" : "member"}</span> },
    ],
    describe: (r) => `${s(r.full_name)} (${s(r.email)})`,
    searchText: (r) => [r.full_name, r.email, r.display_name, (r.events as { title?: string } | null)?.title].map(s).join(" ").toLowerCase(),
  },
  {
    key: "rsvps",
    title: "RSVPs",
    singular: "RSVP",
    table: "rsvps",
    select: "*, events(title, starts_at)",
    order: [{ column: "created_at", ascending: false }],
    canCreate: false,
    csv: true,
    fields: [
      { name: "full_name", label: "Full name", kind: "text", required: true, maxLength: 100 },
      { name: "email", label: "Email", kind: "email", required: true, maxLength: 254 },
    ],
    columns: [
      { label: "Event", render: (r) => s((r.events as { title?: string } | null)?.title) },
      { label: "RSVPed", render: (r) => dateOnly(s(r.created_at).slice(0, 10)) },
      { label: "Name", render: (r) => s(r.full_name) },
      { label: "Email", render: (r) => <span className="font-mono text-xs">{s(r.email)}</span> },
      { label: "Type", render: (r) => <span className="font-mono text-xs">{r.is_guest ? "guest" : "member"}</span> },
    ],
    describe: (r) => `${s(r.full_name)} (${s(r.email)})`,
    searchText: (r) => [r.full_name, r.email, (r.events as { title?: string } | null)?.title].map(s).join(" ").toLowerCase(),
  },
  {
    key: "team",
    title: "Team",
    singular: "team member",
    table: "team_members",
    select: "*",
    order: [{ column: "sort_order" }, { column: "created_at" }],
    fields: [
      { name: "name", label: "Name", kind: "text", required: true, maxLength: 100 },
      { name: "role", label: "Role", kind: "text", required: true, maxLength: 100 },
      { name: "bio", label: "Short bio", kind: "textarea", maxLength: 600, wide: true },
      { name: "photo_url", label: "Photo", kind: "photo", help: "Square image, JPG/PNG/WebP, under 2 MB.", wide: true },
      { name: "links", label: "Links (all optional)", kind: "links", wide: true },
      orderField,
      publishedField,
    ],
    columns: [
      { label: "Order", render: (r) => s(r.sort_order) },
      { label: "Name", render: (r) => s(r.name) },
      { label: "Role", render: (r) => s(r.role) },
      { label: "Status", render: published },
    ],
    describe: (r) => s(r.name),
  },
  {
    key: "contests",
    title: "Past contests",
    singular: "contest",
    table: "past_contests",
    select: "*",
    order: [{ column: "held_on", ascending: false }],
    fields: [
      { name: "title", label: "Title", kind: "text", required: true, maxLength: 200, wide: true },
      { name: "held_on", label: "Date", kind: "date", required: true },
      { name: "kattis_url", label: "Kattis contest link", kind: "url" },
      { name: "problems", label: "Number of problems", kind: "number", min: 0, max: 100 },
      { name: "participants", label: "Participants", kind: "number", min: 0, max: 10000 },
      { name: "description", label: "Description", kind: "textarea", maxLength: 2000, wide: true },
      publishedField,
    ],
    columns: [
      { label: "Date", render: (r) => dateOnly(r.held_on) },
      { label: "Title", render: (r) => s(r.title) },
      { label: "Status", render: published },
    ],
    describe: (r) => s(r.title),
  },
  {
    key: "problems",
    title: "Problems",
    singular: "problem",
    table: "problems",
    select: "*",
    order: [{ column: "difficulty" }, { column: "sort_order" }, { column: "created_at" }],
    fields: [
      { name: "name", label: "Problem name", kind: "text", required: true, maxLength: 200 },
      { name: "url", label: "Link", kind: "url", required: true, help: "A Kattis, Codeforces or LeetCode problem link. The site files it under that platform automatically." },
      { name: "difficulty", label: "Difficulty", kind: "select", required: true, options: [["easy", "Easy"], ["medium", "Medium"], ["hard", "Hard"]] },
      { name: "topic", label: "Topic", kind: "text", maxLength: 60, placeholder: "e.g. BFS, DP, Math" },
      orderField,
      publishedField,
    ],
    columns: [
      { label: "Platform", render: (r) => platformLabel(s(r.url)) },
      { label: "Difficulty", render: (r) => <span className="font-mono text-xs uppercase">{s(r.difficulty)}</span> },
      { label: "Order", render: (r) => s(r.sort_order) },
      { label: "Name", render: (r) => s(r.name) },
      { label: "Topic", render: (r) => s(r.topic) },
      { label: "Status", render: published },
    ],
    describe: (r) => s(r.name),
    searchText: (r) => [r.name, r.topic, r.difficulty].map(s).join(" ").toLowerCase(),
  },
  {
    key: "faq",
    title: "FAQ",
    singular: "question",
    table: "faqs",
    select: "*",
    order: [{ column: "sort_order" }, { column: "created_at" }],
    fields: [
      { name: "question", label: "Question", kind: "text", required: true, maxLength: 300, wide: true },
      { name: "answer", label: "Answer", kind: "textarea", required: true, maxLength: 2000, wide: true },
      orderField,
      publishedField,
    ],
    columns: [
      { label: "Order", render: (r) => s(r.sort_order) },
      { label: "Question", render: (r) => s(r.question) },
      { label: "Status", render: published },
    ],
    describe: (r) => s(r.question),
  },
];
