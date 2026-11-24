import { NextEvent } from "@/components/events/NextEvent";
import { JudgeDemo } from "@/components/home/JudgeDemo";
import { Balloon, BALLOON_COLORS } from "@/components/Balloon";
import { ButtonLink, Container, ExternalButton, SectionHeading } from "@/components/ui";
import { site } from "@/lib/content";
import { fetchEvents } from "@/lib/db/queries";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({ description: site.description, path: "/" });

// The moment this page was built. The countdown uses it until the visitor's clock takes over.
const builtAt = Date.now();

export default async function HomePage() {
  const events = await fetchEvents();

  return (
    <>
      {/* Hero: the headline, and a solution being written and judged */}
      <section className="border-b border-border">
        <Container className="grid items-center gap-12 pt-14 pb-16 sm:pt-20 sm:pb-24 lg:grid-cols-[1fr_1fr] lg:gap-16">
          <div>
            <h1 className="headline text-[min(3.4rem,13vw)] sm:text-[4.75rem] lg:text-[4.25rem] xl:text-[5.25rem]">
              {site.home.headline.match(/[^.!?]+[.!?]?/g)?.map((line) => (
                <span key={line} className="block whitespace-nowrap">
                  {line.trim()}
                </span>
              ))}
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted">{site.home.pitch}</p>
            <div className="mt-10 flex flex-wrap gap-3">
              <ButtonLink href="/join" size="lg">
                Join the club
              </ButtonLink>
              <ButtonLink href="/events" variant="secondary" size="lg">
                See events
              </ButtonLink>
            </div>
          </div>
          <JudgeDemo />
        </Container>
      </section>

      {/* What we do, as a problem set: A, B, C, each with its balloon */}
      <section aria-labelledby="what-we-do" className="py-20 sm:py-28">
        <Container>
          <SectionHeading id="what-we-do">What we do</SectionHeading>
          <ol className="grid border-t border-border md:grid-cols-3">
            {site.home.highlights.map((h, i) => (
              <li
                key={h.title}
                className="flex gap-5 border-b border-border py-8 md:border-b-0 md:py-10 md:pr-10 md:[&:not(:first-child)]:border-l md:[&:not(:first-child)]:pl-10"
              >
                <Balloon color={BALLOON_COLORS[i % BALLOON_COLORS.length]} letter={String.fromCharCode(65 + i)} className="h-20 w-12 shrink-0 text-fg" />
                <div>
                  <h3 className="condensed text-2xl font-bold">{h.title}</h3>
                  <p className="mt-2 leading-relaxed text-muted">{h.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* Next event */}
      <section aria-labelledby="next-event" className="border-t border-border py-20 sm:py-28">
        <Container className="grid gap-10 lg:grid-cols-[1fr_1.5fr] lg:gap-16">
          <div>
            <SectionHeading id="next-event" sub="Weekly practice, workshops and club contests. On campus, and free.">
              Next event
            </SectionHeading>
            <ButtonLink href="/events" variant="secondary">
              All events
            </ButtonLink>
          </div>
          <NextEvent events={events} builtAt={builtAt} />
        </Container>
      </section>

      {/* ICPC: full-width band */}
      <section aria-labelledby="road-to-icpc" className="bg-surface py-20 sm:py-28">
        <Container className="grid gap-10 lg:grid-cols-[1.6fr_1fr] lg:items-end">
          <div>
            <h2 id="road-to-icpc" className="headline text-5xl sm:text-7xl">
              The ICPC East Central regional happens here, at UWindsor.
            </h2>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
              Teams of three, one computer, five hours, a dozen problems. We train UWindsor students from their first
              problem all the way to the regional, and we want to send more teams every year.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <ButtonLink href="/join" size="lg">
              Join the club
            </ButtonLink>
            <ExternalButton href={site.discordUrl} variant="secondary" size="lg">
              Join the Discord
            </ExternalButton>
          </div>
        </Container>
      </section>
    </>
  );
}
