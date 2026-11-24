import { Suspense } from "react";

import { AttendApp } from "@/components/attend/AttendApp";
import { Container, PageHeader } from "@/components/ui";
import { fetchEvents } from "@/lib/db/queries";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Attend",
  description: "Check in to a CPC UWindsor event with the room code, or RSVP to an upcoming one.",
  path: "/attend",
});

export default async function AttendPage() {
  const events = await fetchEvents();

  return (
    <>
      <PageHeader
        command="./attend"
        title="Attendance"
        intro="At an event? Scan the QR code on the screen to check in. Planning to come? RSVP below."
      />
      <Container className="py-14">
        <Suspense fallback={<p className="font-mono text-sm text-muted">Loading check-in…</p>}>
          <AttendApp events={events} />
        </Suspense>
      </Container>
    </>
  );
}
