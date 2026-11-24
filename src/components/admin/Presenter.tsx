"use client";

import QRCode from "qrcode";
import { useCallback, useEffect, useState } from "react";

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
type EventInfo = { title: string; room: string; date: string; time: string };

const timeOnly = (iso: string) =>
  new Intl.DateTimeFormat("en-US", { timeZone: CLUB_TIMEZONE, hour: "numeric", minute: "2-digit" })
    .format(new Date(iso))
    .replace(/ /g, " ");

/**
 * Everything both views need: event details, check-in state (open?, current
 * code), the attendance list, and the QR image. Polls every 2.5 s, so the
 * control view and the presenter window stay in sync through the database.
 */
function useCheckin(eventId: string) {
  const db = getAdminDb();
  const [event, setEvent] = useState<EventInfo | null>(null);
  const [display, setDisplay] = useState<Display | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [qr, setQr] = useState("");
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    db.from("events")
      .select("title, room, starts_at, ends_at")
      .eq("id", eventId)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return setError("Event not found.");
        const s = Date.parse(data.starts_at);
        const e = Date.parse(data.ends_at);
        setEvent({ title: data.title, room: data.room, date: formatEventDate(s, CLUB_TIMEZONE), time: formatEventTime(s, e, CLUB_TIMEZONE) });
      });
  }, [db, eventId]);

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
      else {
        setError("");
        setDisplay(d as Display);
      }
      if (list) setRows(list as Row[]);
    };
    load();
    const t = setInterval(load, 2500);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, [db, eventId, tick]);

  const code = display?.open ? display.code : "";
  useEffect(() => {
    if (!code) return;
    let active = true;
    QRCode.toDataURL(`${window.location.origin}/attend?c=${code}`, {
      margin: 1,
      width: 720,
      errorCorrectionLevel: "M",
      color: { dark: "#000000", light: "#ffffff" },
    })
      .then((url) => active && setQr(url))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [code]);

  return { db, event, display, rows, qr, code, error, setError, refresh };
}

/* ============================== control view ============================== */

/**
 * The admin's own screen: start/end the event, open the presenter window,
 * and manage who checked in (real names and emails). Not for projecting.
 */
export function ControlView({ eventId }: { eventId: string }) {
  const { db, event, display, rows, qr, code, error, setError, refresh } = useCheckin(eventId);
  const [busy, setBusy] = useState(false);
  const open = display?.open === true;
  const visible = rows.filter((r) => !r.hidden);
  const guests = visible.filter((r) => r.is_guest).length;

  async function run(fn: "open_checkin" | "close_checkin") {
    if (fn === "close_checkin" && !window.confirm("End the event? Check-in closes and the code stops working.")) return;
    setBusy(true);
    setError("");
    const { error } = await db.rpc(fn, { p_event_id: eventId });
    if (error) setError(error.message);
    setBusy(false);
    refresh();
  }

  function openPresenter() {
    const url = `/admin/present?event=${eventId}&view=screen`;
    const w = window.open(url, `cpc-screen-${eventId}`, "popup=yes,width=1280,height=760");
    if (!w) window.open(url, "_blank"); // popup blocked: fall back to a tab
  }

  async function toggleHidden(r: Row) {
    await db.from("attendance").update({ hidden: !r.hidden }).eq("id", r.id);
    refresh();
  }

  async function remove(r: Row) {
    if (!window.confirm(`Remove ${r.full_name} (${r.email}) from this event's attendance?`)) return;
    await db.from("attendance").delete().eq("id", r.id);
    refresh();
  }

  const status = open
    ? { text: `Live. Check-in closes at ${timeOnly((display as Extract<Display, { open: true }>).closes_at)}`, cls: "text-easy", dot: "bg-easy animate-pulse" }
    : rows.length > 0
      ? { text: "Ended. Check-in is closed", cls: "text-muted", dot: "bg-muted" }
      : { text: "Not started", cls: "text-muted", dot: "bg-muted" };

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="text-sm text-muted">Event control</span>
        </div>
        <a href="/admin" className={`${secondaryBtn} px-3 py-1.5 text-xs`}>
          Back to admin
        </a>
      </header>

      {error && <p role="alert" className="mx-5 mt-3 rounded-md border border-hard/40 bg-hard/10 p-3 text-sm text-hard">{error}</p>}

      <main className="grid min-h-0 flex-1 gap-5 p-5 lg:grid-cols-[22rem_minmax(0,1fr)]">
        {/* left: event + controls */}
        <section aria-label="Event controls" className="flex min-h-0 flex-col gap-5 overflow-y-auto rounded-lg bg-surface p-5">
          <div>
            <h1 className="condensed text-2xl font-bold leading-tight">{event?.title ?? "…"}</h1>
            <p className="mt-1 text-sm text-muted">
              {event?.date}, {event?.time}
              <br />
              {event?.room}
            </p>
            <p className={`mt-3 flex items-center gap-2 text-sm font-semibold ${status.cls}`}>
              <span aria-hidden="true" className={`size-2 rounded-full motion-reduce:animate-none ${status.dot}`} />
              {status.text}
            </p>
          </div>

          <div className="grid gap-2">
            {open ? (
              <button type="button" disabled={busy} onClick={() => run("close_checkin")} className={`${secondaryBtn} border-hard/50 text-hard`}>
                End event
              </button>
            ) : (
              <button type="button" disabled={busy} onClick={() => run("open_checkin")} className={primaryBtn}>
                {rows.length > 0 ? "Restart event" : "Start event"}
              </button>
            )}
            <button type="button" onClick={openPresenter} className={secondaryBtn}>
              Open presenter window
            </button>
            <p className="text-xs leading-relaxed text-muted">
              Drag the presenter window to the projector, then press <kbd className="rounded border border-border px-1">F</kbd> for full
              screen. It shows only screen names.
            </p>
          </div>

          {open && (
            <div className="flex items-center gap-4 border-t border-border pt-5">
              {qr && (
                // eslint-disable-next-line @next/next/no-img-element -- QR code generated in the browser
                <img src={qr} alt={`QR code, room code ${code}`} className="size-28 shrink-0 rounded-md bg-white p-1.5" />
              )}
              <div>
                <p className="text-xs text-muted">Room code</p>
                <p className="font-mono text-3xl font-extrabold tracking-[0.15em] text-accent">{code}</p>
                <p className="mt-1 text-xs text-muted">changes in {(display as Extract<Display, { open: true }>).seconds_left}s</p>
              </div>
            </div>
          )}
        </section>

        {/* right: attendance */}
        <section aria-labelledby="control-list" className="flex min-h-0 flex-col rounded-lg bg-surface">
          <div className="flex shrink-0 flex-wrap items-baseline justify-between gap-3 border-b border-border px-5 py-4">
            <h2 id="control-list" className="condensed text-2xl font-bold">
              Checked in
            </h2>
            <p className="text-sm text-muted">
              <span className="font-semibold text-fg">{visible.length}</span> on the board
              {guests > 0 && <> ({guests} guest{guests === 1 ? "" : "s"})</>}
              {rows.length !== visible.length && <>, {rows.length - visible.length} hidden</>}
            </p>
          </div>
          {rows.length === 0 ? (
            <p className="p-5 text-muted">{open ? "Waiting for the first check-in…" : "Nobody has checked in yet."}</p>
          ) : (
            <ul className="min-h-0 flex-1 divide-y divide-border overflow-y-auto">
              {rows.map((r) => (
                <li key={r.id} className={`flex items-center justify-between gap-4 px-5 py-3 ${r.hidden ? "opacity-50" : ""}`}>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">
                      {r.display_name}
                      {r.is_guest && <span className="ml-2 text-xs font-normal text-muted">guest</span>}
                      {r.hidden && <span className="ml-2 text-xs font-normal text-muted">hidden</span>}
                    </p>
                    <p className="truncate text-sm text-muted">
                      {r.full_name}, {r.email}, {timeOnly(r.checked_in_at)}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <button type="button" onClick={() => toggleHidden(r)} className={`${secondaryBtn} px-2.5 py-1 text-xs`}>
                      {r.hidden ? "Show" : "Hide"}
                    </button>
                    <button type="button" onClick={() => remove(r)} className={dangerBtn}>
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

/* ============================= presenter view ============================= */

function toggleFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen().catch(() => {});
}

/**
 * The projector window: QR, room code and the board of screen names only.
 * Sized from the window's own width and height so it always fits on one
 * screen. Press F (or the button) for full screen.
 */
export function ScreenView({ eventId }: { eventId: string }) {
  const { event, display, rows, qr, code } = useCheckin(eventId);
  const [fullscreen, setFullscreen] = useState(false);
  const open = display?.open === true;
  const visible = rows.filter((r) => !r.hidden);

  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement));
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "f") toggleFullscreen();
    };
    document.addEventListener("fullscreenchange", onChange);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="relative grid h-dvh w-full grid-cols-[minmax(0,1fr)_minmax(0,1fr)] overflow-hidden">
      {!fullscreen && (
        <button
          type="button"
          onClick={toggleFullscreen}
          className={`${secondaryBtn} absolute top-3 right-3 z-10 px-3 py-1.5 text-xs opacity-60 hover:opacity-100`}
        >
          Full screen (F)
        </button>
      )}

      {/* left: how to check in */}
      <section aria-label="Check in" className="flex min-h-0 flex-col items-center justify-center gap-[2vh] border-r border-border p-[3vh] text-center">
        <p className="text-[clamp(0.9rem,1.8vh,1.4rem)] text-muted">
          {event?.date}, {event?.time}, {event?.room}
        </p>
        <h1 className="headline text-[clamp(1.75rem,5.5vh,4.5rem)]">{event?.title ?? "…"}</h1>

        {open ? (
          <>
            {qr && (
              // eslint-disable-next-line @next/next/no-img-element -- QR code generated in the browser
              <img
                src={qr}
                alt={`QR code to check in. Room code ${code}`}
                className="aspect-square rounded-lg bg-white p-[1vh]"
                style={{ width: "min(46vh, 38vw)" }}
              />
            )}
            <p className="text-[clamp(0.9rem,1.9vh,1.4rem)] text-muted">
              Scan, or go to <span className="text-fg">uwindsorcpc.github.io/attend</span> and enter
            </p>
            <p className="font-mono text-[clamp(2.5rem,9vh,7rem)] leading-none font-extrabold tracking-[0.2em] text-accent" aria-live="polite">
              {code}
            </p>
            <div className="h-[0.6vh] w-[min(30vh,24vw)] overflow-hidden rounded-full bg-surface-2" aria-hidden="true">
              <div
                className="h-full bg-accent transition-[width] duration-1000"
                style={{ width: `${((display as Extract<Display, { open: true }>).seconds_left / 30) * 100}%` }}
              />
            </div>
          </>
        ) : visible.length > 0 ? (
          <p className="headline mt-[4vh] text-[clamp(2rem,7vh,5rem)]">Thanks for coming</p>
        ) : (
          <p className="mt-[4vh] text-[clamp(1.2rem,3.5vh,2.5rem)] text-muted">Check-in opens soon</p>
        )}
      </section>

      {/* right: the board */}
      <section aria-labelledby="screen-board" className="flex min-h-0 flex-col p-[3vh]">
        <div className="flex shrink-0 items-baseline justify-between gap-4">
          <h2 id="screen-board" className="condensed text-[clamp(1.5rem,4.5vh,3.5rem)] font-bold">
            Who&apos;s here
          </h2>
          <p className="text-[clamp(1rem,3vh,2.25rem)] text-muted">
            <span className="headline text-accent">{visible.length}</span> checked in
          </p>
        </div>
        <div className="relative mt-[2.5vh] min-h-0 flex-1 overflow-hidden">
          {visible.length === 0 ? (
            <p className="text-[clamp(1rem,2.6vh,1.75rem)] text-muted">Nobody yet. Scan the code to be first.</p>
          ) : (
            <ul className="flex flex-wrap content-start gap-[1.2vh]">
              {visible.map((r) => (
                <li
                  key={r.id}
                  className="rounded-md border border-border bg-surface px-[1.6vh] py-[0.9vh] text-[clamp(0.95rem,2.4vh,1.75rem)] font-semibold"
                >
                  {r.display_name}
                  {r.is_guest && <span className="ml-[1vh] text-[0.7em] font-normal text-muted">guest</span>}
                </li>
              ))}
            </ul>
          )}
          {/* newest are first; older names fade out at the bottom if the screen is full */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-[8vh] bg-gradient-to-t from-bg to-transparent" />
        </div>
      </section>
    </div>
  );
}
