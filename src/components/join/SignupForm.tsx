"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";

import { clearPrefill, readPrefill } from "@/lib/attendance";

import { publicDb } from "@/lib/supabase/clients";
import { isPlaceholder } from "@/lib/placeholder";
import { CheckIcon } from "../icons";

const YEARS = [
  ["1", "1st year"],
  ["2", "2nd year"],
  ["3", "3rd year"],
  ["4", "4th year"],
  ["5+", "5th year or later"],
  ["grad", "Graduate student"],
  ["other", "Other"],
] as const;

const EXPERIENCE = [
  ["none", "New to competitive programming"],
  ["beginner", "Beginner: solved a few problems"],
  ["intermediate", "Intermediate: comfortable with common algorithms"],
  ["advanced", "Advanced: competed before (ICPC, Codeforces…)"],
] as const;

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "done"; returnTo?: string; returnLabel?: string }
  | { kind: "error"; message: string };

const input =
  "mt-1.5 w-full rounded-lg border border-border bg-bg px-3.5 py-2.5 text-fg placeholder:text-muted/70 focus:border-accent focus:outline-none";
const label = "block text-sm font-medium";

/** Member sign-up. Sends one row to the database through submit_signup(). */
export function SignupForm({ clubEmail }: { clubEmail: string }) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const formRef = useRef<HTMLFormElement>(null);

  // Coming from check-in or RSVP? Fill in the name and email they already typed.
  // (Handed over through session storage, never the URL.)
  useEffect(() => {
    const p = readPrefill();
    const form = formRef.current;
    if (!p || !form) return;
    const set = (name: string, value: string) => {
      const el = form.elements.namedItem(name);
      if (el instanceof HTMLInputElement && !el.value) el.value = value;
    };
    set("full_name", p.fullName);
    set("email", p.email);
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const get = (k: string) => String(f.get(k) ?? "").trim();

    setStatus({ kind: "sending" });
    const { error } = await publicDb.rpc("submit_signup", {
      p_full_name: get("full_name"),
      p_email: get("email"),
      p_program: get("program"),
      p_year_of_study: get("year_of_study"),
      p_experience: get("experience"),
      p_codeforces_handle: get("codeforces_handle"),
      p_consent: f.get("consent") === "on",
    });

    if (error) {
      const busy = error.code === "53400";
      setStatus({
        kind: "error",
        message: busy
          ? "Lots of people are signing up right now. Please try again in a minute."
          : "Something went wrong and your sign-up wasn't saved. Please check your details and try again.",
      });
      return;
    }
    const p = readPrefill();
    clearPrefill();
    setStatus({ kind: "done", returnTo: p?.returnTo, returnLabel: p?.returnLabel });
  }

  if (status.kind === "done") {
    return (
      <div role="status" className="rounded-lg border border-easy/50 bg-easy/10 p-6">
        <p className="flex items-center gap-2 text-lg font-semibold text-easy">
          <CheckIcon /> You&apos;re signed up!
        </p>
        <p className="mt-2 text-muted">Welcome to CPC UWindsor. Join the Discord next so you hear about every event.</p>
        {status.returnTo && (
          <Link href={status.returnTo} className="mt-4 inline-flex text-sm font-semibold text-accent underline underline-offset-4">
            ← {status.returnLabel ?? "Go back"}
          </Link>
        )}
      </div>
    );
  }

  const sending = status.kind === "sending";

  return (
    <form ref={formRef} onSubmit={onSubmit} className="grid gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="full_name" className={label}>
            Full name <span className="text-hard" aria-hidden="true">*</span>
          </label>
          <input id="full_name" name="full_name" required maxLength={100} autoComplete="name" className={input} />
        </div>
        <div>
          <label htmlFor="email" className={label}>
            Email <span className="text-hard" aria-hidden="true">*</span>
          </label>
          <input id="email" name="email" type="email" required maxLength={254} autoComplete="email" placeholder="you@uwindsor.ca" className={input} />
        </div>
        <div>
          <label htmlFor="program" className={label}>
            Program
          </label>
          <input id="program" name="program" maxLength={100} placeholder="e.g. Computer Science" className={input} />
        </div>
        <div>
          <label htmlFor="year_of_study" className={label}>
            Year
          </label>
          <select id="year_of_study" name="year_of_study" defaultValue="" className={input}>
            <option value="">Prefer not to say</option>
            {YEARS.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="experience" className={label}>
            Experience
          </label>
          <select id="experience" name="experience" defaultValue="none" className={input}>
            {EXPERIENCE.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="codeforces_handle" className={label}>
            Codeforces handle <span className="font-normal text-muted">(optional)</span>
          </label>
          <input
            id="codeforces_handle"
            name="codeforces_handle"
            maxLength={24}
            pattern="[A-Za-z0-9_.\-]{3,24}"
            title="3–24 letters, numbers, dots, dashes or underscores"
            autoComplete="off"
            className={input}
          />
        </div>
      </div>

      <label className="flex items-start gap-3 text-sm text-muted">
        <input type="checkbox" name="consent" required className="mt-1 size-4 shrink-0 accent-[var(--accent)]" />
        <span>
          I agree that CPC UWindsor may store these details to contact me about club activities. Only the club&apos;s
          executives can see them. I can ask for them to be deleted at any time
          {isPlaceholder(clubEmail) ? "" : ` by emailing ${clubEmail}`}.
        </span>
      </label>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={sending}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-button px-7 py-3.5 font-semibold text-on-accent transition-colors hover:bg-button-hover disabled:cursor-wait disabled:opacity-70"
        >
          {sending ? "Signing you up…" : "Sign up"}
        </button>
        <p aria-live="polite" className="text-sm text-hard">
          {status.kind === "error" ? status.message : ""}
        </p>
      </div>
    </form>
  );
}
