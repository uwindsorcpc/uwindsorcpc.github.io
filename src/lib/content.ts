/**
 * Loads the file-based content in /content: club settings, the About page,
 * the roadmap and resources, and the code templates.
 *
 * Events, team, contests, problems, FAQ and sign-ups live in the Supabase
 * database instead and are edited from /admin (see src/lib/db).
 */
import fs from "node:fs";
import path from "node:path";
import { marked } from "marked";

import siteJson from "@content/site.json";
import resourcesJson from "@content/resources.json";

export { isPlaceholder } from "./placeholder";

const CONTENT_DIR = path.join(process.cwd(), "content");

export type SocialIcon = "discord" | "instagram" | "github" | "linkedin" | "email" | "website";

export const site = siteJson as {
  showSampleContentBanner: boolean;
  name: string;
  fullName: string;
  url: string;
  description: string;
  email: string;
  discordUrl: string;
  socials: { label: string; icon: SocialIcon; url: string }[];
  home: {
    headline: string;
    pitch: string;
    highlights: { title: string; command: string; text: string }[];
  };
};

export type LinkItem = { label: string; url: string };
export const resources = resourcesJson as {
  roadmap: { title: string; duration?: string; text: string; links?: LinkItem[] }[];
  platforms: { name: string; url: string; text: string }[];
  books: { name: string; author?: string; url: string; text: string }[];
};

export function readTemplate(file: "template.cpp" | "template.py"): string {
  return fs.readFileSync(path.join(CONTENT_DIR, "templates", file), "utf8");
}

/** Renders a Markdown file from /content to HTML (content is written by the execs). */
export function readMarkdown(file: string): string {
  const md = fs.readFileSync(path.join(CONTENT_DIR, file), "utf8").replace(/<!--[\s\S]*?-->/g, "");
  return marked.parse(md, { async: false });
}
