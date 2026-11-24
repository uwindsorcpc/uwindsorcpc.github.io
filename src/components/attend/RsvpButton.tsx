"use client";

import { useId, useState, type FormEvent } from "react";

import { icsFor, submitRsvp } from "@/lib/attendance";
import type { ClubEvent } from "@/lib/db/types";
import { inputClass, labelClass, primaryBtn, secondaryBtn } from "../admin/styles";
import { Modal } from "./Modal";
import { NotMemberChoice } from "./NotMemberChoice";
import { Verdict } from "./Verdict";

type Step =
  | { kind: "form"; error?: string }
  | { kind: "sending" }
  | { kind: "notMember"; busy: boolean }
  | { kind: "done"; already: boolean; guest: boolean }
  | { kind: "closed" };

function downloadIcs(event: ClubEvent) {
  const url = URL.createObjectURL(new Blob([icsFor(event)], { type: "text/calendar;charset=utf-8" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: "cpc-uwindsor-event.ics" });
  a.click();
  URL.revokeObjectURL(url);
}

/** "RSVP" button for an upcoming event, with a small form in a pop-up. */
export function RsvpButton({ event, going }: { event: ClubEvent; going?: number }) {
  const headingId = useId();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>({ kind: "form" });
  const [who, setWho] = useState({ fullName: "", email: "" });

  async function send(asGuest: boolean, details = who) {
    try {
      const status = await submitRsvp({ eventId: event.id, ...details, asGuest });
      if (status === "not_member") setStep({ kind: "notMember", busy: false });
      else if (status === "going" || status === "already") setStep({ kind: "done", already: status === "already", guest: asGuest });
      else if (status === "closed") setStep({ kind: "closed" });
      else setStep({ kind: "form", error: "Lots of people are RSVPing right now. Please try again in a minute." });
    } catch (e) {
      setStep({ kind: "form", error: (e as Error).message });
    }
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const details = { fullName: String(f.get("full_name") ?? "").trim(), email: String(f.get("email") ?? "").trim() };
    setWho(details);
    setStep({ kind: "sending" });
    await send(false, details);
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => {
            setStep({ kind: "form" });
            setOpen(true);
          }}
          className={`${primaryBtn} px-3 py-1.5 text-xs`}
        >
          RSVP
        </button>
        {going ? <span className="text-sm text-muted">{going} going</span> : null}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} labelledBy={headingId}>
        {step.kind === "notMember" ? (
          <NotMemberChoice
            headingId={headingId}
            fullName={who.fullName}
            email={who.email}
            returnTo="/events"
            returnLabel="Back to events"
            busy={step.busy}
            onGuest={() => {
              setStep({ kind: "notMember", busy: true });
              send(true);
            }}
            onCancel={() => setOpen(false)}
          />
        ) : step.kind === "done" ? (
          <div className="grid gap-4">
            <h2 id={headingId} className="sr-only">
              RSVP saved
            </h2>
            <Verdict tone="ok" verdict={step.already ? "Already Accepted" : "Accepted ✓"}>
              {step.already ? "You'd already RSVPed. " : "You're on the list. "}
              See you at <strong>{event.title}</strong> on {event.dateLabel}, {event.timeLabel}.
              {step.guest && " (as a guest)"}
            </Verdict>
            <button type="button" onClick={() => downloadIcs(event)} className={secondaryBtn}>
              Add to calendar
            </button>
            <button type="button" onClick={() => setOpen(false)} className={primaryBtn}>
              Done
            </button>
          </div>
        ) : step.kind === "closed" ? (
          <div className="grid gap-4">
            <h2 id={headingId} className="sr-only">
              RSVP closed
            </h2>
            <Verdict tone="warn" verdict="Time Limit Exceeded">
              RSVPs for this event have closed.
            </Verdict>
            <button type="button" onClick={() => setOpen(false)} className={secondaryBtn}>
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="grid gap-4">
            <div>
              <h2 id={headingId} className="condensed text-2xl font-bold">
                {event.title}
              </h2>
              <p className="mt-1 text-sm text-muted">
                {event.dateLabel}, {event.timeLabel}
                <br />
                {event.room}
              </p>
            </div>
            <div>
              <label htmlFor={`${headingId}-name`} className={labelClass}>
                Full name
              </label>
              <input id={`${headingId}-name`} name="full_name" required maxLength={100} autoComplete="name" defaultValue={who.fullName} className={inputClass} />
            </div>
            <div>
              <label htmlFor={`${headingId}-email`} className={labelClass}>
                Email
              </label>
              <input
                id={`${headingId}-email`}
                name="email"
                type="email"
                required
                maxLength={254}
                autoComplete="email"
                defaultValue={who.email}
                className={inputClass}
              />
              <p className="mt-1 text-xs text-muted">Members: use the email you signed up with.</p>
            </div>
            {step.kind === "form" && step.error && <Verdict tone="error" verdict="Compilation Error">{step.error}</Verdict>}
            <div className="flex gap-3">
              <button type="submit" disabled={step.kind === "sending"} className={primaryBtn}>
                {step.kind === "sending" ? "Sending…" : "RSVP"}
              </button>
              <button type="button" onClick={() => setOpen(false)} className={secondaryBtn}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
