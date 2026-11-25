"use client";

import { use, useEffect, useId, useState, type FormEvent } from "react";
import { browser } from "react-dom";

import {
  getOpenCheckin,
  getRsvpCounts,
  startCheckin,
  submitCheckin,
  type OpenCheckin,
} from "@/lib/attendance";
import { useNowEveryMinute } from "@/lib/clock";
import { fetchEvents } from "@/lib/db/queries";
import type { ClubEvent } from "@/lib/db/types";
import { useLive } from "@/lib/db/useLive";
import { inputClass, labelClass, primaryBtn } from "../admin/styles";
import { EventCard } from "../events/EventCard";
import { Board } from "./Board";
import { Modal } from "./Modal";
import { NotMemberChoice } from "./NotMemberChoice";
import { RsvpButton } from "./RsvpButton";
import { Verdict } from "./Verdict";

const TICKET_KEY = "cpc-checkin-ticket";
type Ticket = { ticket: string; eventId: string; expires: number };

function loadTicket(): Ticket | null {
  try {
    const t = JSON.parse(sessionStorage.getItem(TICKET_KEY) ?? "null") as Ticket | null;
    return t && t.expires > Date.now() ? t : null;
  } catch {
    return null;
  }
}
function saveTicket(t: Ticket | null) {
  try {
    if (t) sessionStorage.setItem(TICKET_KEY, JSON.stringify(t));
    else sessionStorage.removeItem(TICKET_KEY);
  } catch {
    /* storage blocked: the ticket lives only in memory */
  }
}

type Details = { fullName: string; email: string; displayName: string };
type Outcome =
  | { kind: "accepted"; displayName: string; guest: boolean }
  | { kind: "already" }
  | { kind: "error"; verdict: string; message: string; tone: "error" | "warn" };

/**
 * The /attend page. Runs only in the browser: it reads the room code from
 * the QR link and keeps the check-in ticket in this tab's session storage.
 */
export function AttendApp({ events: initialEvents }: { events: ClubEvent[] }) {
  use(browser("Check-in reads the room code from the link and keeps a ticket in this browser tab."));
  const ids = useId();

  const [checkin, setCheckin] = useState<OpenCheckin | null | undefined>(undefined);
  const [ticket, setTicket] = useState<Ticket | null>(loadTicket);
  const [urlCode] = useState(() => new URLSearchParams(window.location.search).get("c"));
  const [codeError, setCodeError] = useState<{ verdict: string; message: string } | null>(null);
  const [checkingCode, setCheckingCode] = useState(() => Boolean(urlCode) && !loadTicket());
  const [details, setDetails] = useState<Details>({ fullName: "", email: "", displayName: "" });
  const [sending, setSending] = useState(false);
  const [notMember, setNotMember] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  const events = useLive(fetchEvents, initialEvents);
  const counts = useLive(getRsvpCounts, {});
  const now = useNowEveryMinute() ?? 0;

  // Keep an eye on whether check-in is open.
  useEffect(() => {
    let active = true;
    const load = () =>
      getOpenCheckin()
        .then((c) => active && setCheckin(c))
        .catch(() => active && setCheckin(null));
    load();
    const t = setInterval(load, 20_000);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, []);

  // A code from the QR link is traded for a ticket once, then removed from the
  // address bar so it isn't shared by accident.
  useEffect(() => {
    if (!urlCode) return;
    window.history.replaceState(null, "", window.location.pathname);
    if (loadTicket()) return;
    trade(urlCode).finally(() => setCheckingCode(false));
  }, [urlCode]);

  async function trade(code: string) {
    setCodeError(null);
    try {
      const res = await startCheckin(code);
      if (res.status === "ok") {
        const open = await getOpenCheckin();
        const t = { ticket: res.ticket, eventId: open?.event_id ?? "", expires: Date.now() + 14 * 60_000 };
        saveTicket(t);
        setTicket(t);
        setCheckin(open);
      } else if (res.status === "wrong_code") {
        setCodeError({ verdict: "Wrong Answer", message: "That code didn't match. Codes change every 30 seconds, so check the screen and try again." });
      } else if (res.status === "closed") {
        setCodeError({ verdict: "Time Limit Exceeded", message: "Check-in isn't open right now." });
      } else {
        setCodeError({ verdict: "Busy", message: "Too many attempts right now. Wait a moment and try again." });
      }
    } catch (e) {
      setCodeError({ verdict: "Runtime Error", message: (e as Error).message });
    }
  }

  async function send(asGuest: boolean, d: Details) {
    if (!ticket) return;
    setSending(true);
    try {
      const res = await submitCheckin({ ticket: ticket.ticket, ...d, asGuest });
      switch (res.status) {
        case "accepted":
          saveTicket(null);
          setTicket(null);
          setNotMember(false);
          setOutcome({ kind: "accepted", displayName: res.display_name ?? "", guest: Boolean(res.guest) });
          break;
        case "already":
          setNotMember(false);
          setOutcome({ kind: "already" });
          break;
        case "not_member":
          setNotMember(true);
          break;
        case "closed":
          setNotMember(false);
          setOutcome({ kind: "error", tone: "warn", verdict: "Time Limit Exceeded", message: "Check-in for this event has closed." });
          break;
        case "busy":
          setOutcome({ kind: "error", tone: "warn", verdict: "Busy", message: "Lots of people are checking in. Please try again in a moment." });
          break;
        default: // bad_ticket, too_many
          saveTicket(null);
          setTicket(null);
          setNotMember(false);
          setOutcome({ kind: "error", tone: "warn", verdict: "Time Limit Exceeded", message: "Your check-in link has expired. Scan the code on the screen again." });
      }
    } catch (e) {
      setNotMember(false);
      setOutcome({ kind: "error", tone: "error", verdict: "Compilation Error", message: (e as Error).message });
    } finally {
      setSending(false);
    }
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const d = {
      fullName: String(f.get("full_name") ?? "").trim(),
      email: String(f.get("email") ?? "").trim(),
      displayName: String(f.get("display_name") ?? "").trim(),
    };
    setDetails(d);
    setOutcome(null);
    send(false, d);
  }

  /* ------------------------------- render ------------------------------- */

  if (checkin === undefined || checkingCode) {
    return <p className="text-muted">Checking for an open check-in…</p>;
  }

  if (!checkin) {
    const upcoming = events.filter((e) => e.startMs > now).slice(0, 3);
    return (
      <div className="grid gap-10">
        <div className="max-w-2xl">
          <p className="condensed text-3xl font-bold">No check-in open right now</p>
          <p className="mt-2 text-sm text-muted">
            When an event starts, scan the QR code on the screen in the room, or come back here and enter the code.
          </p>
        </div>
        <section aria-labelledby={`${ids}-upcoming`}>
          <h2 id={`${ids}-upcoming`} className="condensed mb-4 text-2xl font-bold">
            Coming up. RSVP so we know you&apos;re coming
          </h2>
          {upcoming.length === 0 ? (
            <p className="text-muted">No upcoming events yet. Check back soon.</p>
          ) : (
            <ul className="divide-y divide-border border-y border-border">
              {upcoming.map((e) => (
                <li key={e.id}>
                  <EventCard event={e} footer={<RsvpButton event={e} going={counts[e.id]} />} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    );
  }

  const hasTicket = ticket && ticket.eventId === checkin.event_id;

  return (
    <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-start">
      <section aria-labelledby={`${ids}-checkin`} className="rounded-lg bg-surface p-6 sm:p-8">
        <p className="flex items-center gap-2 text-sm font-semibold text-easy">
          <span aria-hidden="true" className="size-2 animate-pulse rounded-full bg-easy motion-reduce:animate-none" />
          Check-in is open
        </p>
        <h2 id={`${ids}-checkin`} className="condensed mt-2 text-3xl font-bold">
          {checkin.title}
        </h2>
        <p className="mt-1 text-sm text-muted">{checkin.room}</p>

        <div className="mt-6 grid gap-5">
          {outcome?.kind === "accepted" ? (
            <Verdict tone="ok" verdict="Accepted ✓">
              You&apos;re checked in{outcome.guest ? " as a guest" : ""}. You&apos;re on the board as{" "}
              <strong>{outcome.displayName}</strong>.
              {outcome.guest && (
                <span className="mt-2 block text-muted">
                  Enjoyed it? <a href="/join" className="text-accent underline underline-offset-4">Become a member</a>.
                </span>
              )}
            </Verdict>
          ) : outcome?.kind === "already" ? (
            <Verdict tone="ok" verdict="Already Accepted">
              You&apos;re already checked in for this event.
            </Verdict>
          ) : !hasTicket ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                trade(String(new FormData(e.currentTarget).get("code") ?? ""));
              }}
              className="grid gap-4"
            >
              <div>
                <label htmlFor={`${ids}-code`} className={labelClass}>
                  Room code
                </label>
                <input
                  id={`${ids}-code`}
                  name="code"
                  required
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  maxLength={7}
                  placeholder="e.g. K7QXP"
                  className={`${inputClass} font-mono text-lg uppercase tracking-[0.3em]`}
                />
                <p className="mt-1 text-xs text-muted">
                  Scan the QR code on the screen, or type the 5-character code shown under it.
                </p>
              </div>
              {codeError && (
                <Verdict tone="error" verdict={codeError.verdict}>
                  {codeError.message}
                </Verdict>
              )}
              <button type="submit" className={primaryBtn}>
                Continue
              </button>
            </form>
          ) : (
            <form onSubmit={onSubmit} className="grid gap-4">
              <div>
                <label htmlFor={`${ids}-name`} className={labelClass}>
                  Full name
                </label>
                <input id={`${ids}-name`} name="full_name" required maxLength={100} autoComplete="name" defaultValue={details.fullName} className={inputClass} />
              </div>
              <div>
                <label htmlFor={`${ids}-email`} className={labelClass}>
                  Email
                </label>
                <input
                  id={`${ids}-email`}
                  name="email"
                  type="email"
                  required
                  maxLength={254}
                  autoComplete="email"
                  defaultValue={details.email}
                  className={inputClass}
                />
                <p className="mt-1 text-xs text-muted">Members: use the email you signed up with.</p>
              </div>
              <div>
                <label htmlFor={`${ids}-display`} className={labelClass}>
                  What should we show on screen? <span className="font-normal text-muted">(optional)</span>
                </label>
                <input
                  id={`${ids}-display`}
                  name="display_name"
                  maxLength={30}
                  autoComplete="nickname"
                  placeholder="Leave blank for a random anonymous name"
                  defaultValue={details.displayName}
                  aria-describedby={`${ids}-display-help`}
                  className={inputClass}
                />
                <p id={`${ids}-display-help`} className="mt-1 text-xs text-medium">
                  ⚠ This appears on the projector and on this page. Keep it friendly: inappropriate names will be removed.
                </p>
              </div>
              {outcome?.kind === "error" && (
                <Verdict tone={outcome.tone} verdict={outcome.verdict}>
                  {outcome.message}
                </Verdict>
              )}
              <button type="submit" disabled={sending} className={primaryBtn}>
                {sending ? "Checking in…" : "Check in"}
              </button>
              <p className="text-xs text-muted">
                Your name and email are only visible to the club&apos;s executives.
              </p>
            </form>
          )}
          {outcome?.kind === "error" && !hasTicket && (
            <Verdict tone={outcome.tone} verdict={outcome.verdict}>
              {outcome.message}
            </Verdict>
          )}
        </div>
      </section>

      <Board highlight={outcome?.kind === "accepted" ? outcome.displayName : undefined} />

      <Modal open={notMember} onClose={() => setNotMember(false)} labelledBy={`${ids}-notmember`}>
        <NotMemberChoice
          headingId={`${ids}-notmember`}
          fullName={details.fullName}
          email={details.email}
          returnTo="/attend"
          returnLabel="Back to check-in"
          busy={sending}
          onGuest={() => send(true, details)}
          onCancel={() => setNotMember(false)}
        />
      </Modal>
    </div>
  );
}
