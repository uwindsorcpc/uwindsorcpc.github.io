import { EventsBrowser } from "@/components/events/EventsBrowser";
import { Container, PageHeader } from "@/components/ui";
import { fetchEvents } from "@/lib/db/queries";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Events",
  description: "Weekly practice sessions, workshops and club contests run by CPC UWindsor. All free, all on campus.",
  path: "/events",
});

const builtAt = Date.now();

export default async function EventsPage() {
  const events = await fetchEvents();

  return (
    <>
      <PageHeader
        title="Events"
        intro="Practice nights, workshops and contests. Everyone is welcome; bring a laptop. All times are Windsor time (Eastern)."
      />
      <Container className="py-14">
        <EventsBrowser events={events} builtAt={builtAt} />
      </Container>
    </>
  );
}
