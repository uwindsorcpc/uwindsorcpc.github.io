"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";

import { getAdminDb } from "@/lib/supabase/clients";
import { CLUB_TIMEZONE, formatEventDate, formatEventTime } from "@/lib/time";
import { Logo } from "../Logo";
import { dangerBtn, primaryBtn, secondaryBtn } from "./styles";

type Display = { open: false } | { open: true; code: string; seconds_left: number; closes_at: string };
type Row = {
  id: string;
  full_name: string;
  email: string;
  display_name: string;
  is_guest: boolean;
  hidden: boolean;
  checked_in_at: string;
};

/**
 * Full-screen check-in view for the projector: rotating QR + code, and the
 * live board. Real names and emails stay hidden unless you reveal them.
 */
export function Presenter({ eventId }: { eventId: string }) {
  const db = getAdminDb();
  const [event, setEvent] = useState<{ title: string; room: string; label: string } | null>(null);
  const [display, setDisplay] = useState<Display | null>(null);
  const [qr, setQr] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [showPrivate, setShowPrivate] = useState(false);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);

  const code = display?.open ? display.code : "";
  const link = code ? `${window.location.origin}/attend?c=${code}` : "";

  // Event details (once).
  useEffect(() => {
    db.from("events")
      .select("title, room, starts_at, ends_at")
      .eq("id", eventId)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return setError("Event not found.");
        const s = Date.parse(data.starts_at);
        const e = Date.parse(data.ends_at);
        setEvent({ title: data.title, room: data.room, label: `${formatEventDate(s, CLUB_TIMEZONE)} · ${formatEventTime(s, e, CLUB_TIMEZONE)}` });
      });
  }, [db, eventId]);

  // Code + board refresh. The code changes every 30 s; poll a little faster.
  useEffect(() => {
    let active = true;
    const load = async () => {
      const [{ data: d, error: dErr }, { data: list }] = await Promise.all([
        db.rpc("checkin_display", { p_event_id: eventId }),
        db
          .from("attendance")
          .select("id, full_name, email, display_name, is_guest, hidden, checked_in_at")
          .eq("event_id", eventId)
          .order("checked_in_at", { ascending: false }),
      ]);
      if (!active) return;
      if (dErr) setError(dErr.message);
      else setDisplay(d as Display);
      if (list) setRows(list as Row[]);
    };
    load();
    const t = setInterval(load, 2500);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, [db, eventId, tick]);

  // Redraw the QR whenever the code changes.
  useEffect(() => {
    if (!link) return;
    let active = true;
    QRCode.toDataURL(link, { margin: 1, width: 640, errorCorrectionLevel: "M", color: { dark: "#000000", light: "#ffffff" } })
      .then((url) => active && setQr(url))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [link]);

  async function run(fn: "open_checkin" | "close_checkin") {
    setError("");
    const { error } = await db.rpc(fn, { p_event_id: eventId });
    if (error) setError(error.message);
    setTick((t) => t + 1);
  }

  async function toggleHidden(r: Row) {
    await db.from("attendance").update({ hidden: !r.hidden }).eq("id", r.id);
    setTick((t) => t + 1);
  }

  async function remove(r: Row) {
    if (!window.confirm(`Remove ${r.full_name} (${r.email}) from this event's attendance?`)) return;
    await db.from("attendance").delete().eq("id", r.id);
    setTick((t) => t + 1);
  }

  const visible = rows.filter((r) => !r.hidden);
  const guests = visible.filter((r) => r.is_guest).length;

  return (
    <div className="min-h-dvh bg-bg">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4">
        <Logo />
        <div className="flex flex-wrap items-center gap-2">
          {display?.open ? (
            <button type="button" onClick={() => run("close_checkin")} className={secondaryBtn}>
              Close check-in
            </button>
          ) : (
            <button type="button" onClick={() => run("open_checkin")} className={primaryBtn}>
              Open check-in
            </button>
          )}
          <button
            type="button"
            onClick={() => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen())}
            className={secondaryBtn}
          >
            Full screen
          </button>
          <label className="flex items-center gap-2 rounded-lg border border-hard/40 px-3 py-2 font-mono text-xs text-hard">
            <input type="checkbox" checked={showPrivate} onChange={(e) => setShowPrivate(e.target.checked)} className="accent-[var(--hard)]" />
            Show names &amp; emails (don&apos;t project!)
          </label>
        </div>
      </header>

      {error && <p role="alert" className="mx-6 mt-4 rounded-lg border border-hard/40 bg-hard/10 p-3 text-sm text-hard">{error}</p>}

      <main className="grid gap-8 p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:p-10">
        <section aria-label="Check-in code" className="flex flex-col items-center rounded-2xl border border-border bg-surface p-8 text-center">
          <p className="font-mono text-sm text-muted">{event?.label}</p>
          <h1 className="mt-2 text-3xl font-bold lg:text-4xl">{event?.title ?? "…"}</h1>
          <p className="mt-1 text-muted">{event?.room}</p>

          {display?.open ? (
            <>
              {qr && (
                // eslint-disable-next-line @next/next/no-img-element -- QR code generated in the browser
                <img src={qr} alt={`QR code to check in. Code ${code}`} className="mt-8 aspect-square w-full max-w-md rounded-xl bg-white p-3" />
              )}
              <p className="mt-6 font-mono text-sm text-muted">or go to uwindsorcpc.github.io/attend and enter</p>
              <p className="mt-2 font-mono text-6xl font-extrabold tracking-[0.25em] text-accent lg:text-7xl" aria-live="polite">
                {code}
              </p>
              <div className="mt-4 h-1.5 w-48 overflow-hidden rounded-full bg-surface-2" aria-hidden="true">
                <div className="h-full bg-accent transition-[width] duration-1000" style={{ width: `${(display.seconds_left / 30) * 100}%` }} />
              </div>
              <p className="mt-2 font-mono text-xs text-muted">new code in {display.seconds_left}s</p>
            </>
          ) : (
            <div className="mt-10 rounded-xl border border-dashed border-border p-10">
              <p className="font-mono text-lg font-bold">Check-in is closed</p>
              <p className="mt-2 text-sm text-muted">Click “Open check-in” to show the QR code.</p>
            </div>
          )}
        </section>

        <section aria-labelledby="present-board" className="rounded-2xl border border-border bg-surface p-8">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 id="present-board" className="font-mono text-2xl font-bold">
              <span aria-hidden="true" className="text-accent">
                ##{" "}
              </span>
              Who&apos;s here
            </h2>
            <p className="font-mono text-lg">
              <span className="text-accent">{visible.length}</span> checked in
              {guests > 0 && <span className="text-muted"> · {guests} guest{guests === 1 ? "" : "s"}</span>}
            </p>
          </div>

          {rows.length === 0 ? (
            <p className="mt-6 font-mono text-muted">Nobody yet. Scan the code to be first!</p>
          ) : (
            <ul className="mt-6 grid gap-2 sm:grid-cols-2">
              {rows.map((r) => (
                <li
                  key={r.id}
                  className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 ${r.hidden ? "border-dashed border-border opacity-50" : "border-border bg-surface-2"}`}
                >
                  <div className="min-w-0">
                    <p className="truncate font-mono text-lg font-semibold">
                      {r.display_name}
                      {r.is_guest && <span className="ml-2 align-middle text-xs font-normal text-muted">guest</span>}
                    </p>
                    {showPrivate && (
                      <p className="truncate text-xs text-muted">
                        {r.full_name} · {r.email}
                      </p>
                    )}
                  </div>
                  {showPrivate && (
                    <div className="flex shrink-0 gap-1.5">
                      <button type="button" onClick={() => toggleHidden(r)} className={`${secondaryBtn} px-2 py-1 text-xs`}>
                        {r.hidden ? "Show" : "Hide"}
                      </button>
                      <button type="button" onClick={() => remove(r)} className={dangerBtn}>
                        Remove
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
          {!showPrivate && rows.length > 0 && (
            <p className="mt-6 font-mono text-xs text-muted">Tick “Show names &amp; emails” to hide or remove an entry.</p>
          )}
        </section>
      </main>
    </div>
  );
}
