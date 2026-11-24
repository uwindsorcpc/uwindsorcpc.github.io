"use client";

import { useSearchParams } from "next/navigation";

import { AdminGate } from "./AdminApp";
import { AuthCard } from "./AuthScreens";
import { ControlView, ScreenView } from "./Presenter";

/**
 * /admin/present?event=ID              → control view (your laptop)
 * /admin/present?event=ID&view=screen  → presenter view (the projector)
 */
export function PresenterApp() {
  const params = useSearchParams();
  const eventId = params.get("event");
  if (!eventId) {
    return (
      <AuthCard title="No event selected">
        <p className="text-sm text-muted">Open this from Admin → Events → “Run event”.</p>
      </AuthCard>
    );
  }
  const screen = params.get("view") === "screen";
  // keepAlive: neither view should sign itself out during an event.
  return <AdminGate keepAlive>{() => (screen ? <ScreenView eventId={eventId} /> : <ControlView eventId={eventId} />)}</AdminGate>;
}
