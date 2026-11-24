"use client";

import { useSearchParams } from "next/navigation";

import { AdminGate } from "./AdminApp";
import { AuthCard } from "./AuthScreens";
import { Presenter } from "./Presenter";

export function PresenterApp() {
  const eventId = useSearchParams().get("event");
  if (!eventId) {
    return (
      <AuthCard title="No event selected">
        <p className="text-sm text-muted">Open this screen from Admin → Events → “Check-in screen”.</p>
      </AuthCard>
    );
  }
  return <AdminGate>{() => <Presenter eventId={eventId} />}</AdminGate>;
}
