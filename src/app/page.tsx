import { NextEvent } from "@/components/events/NextEvent";
import { ArrowRightIcon, CalendarIcon, CodeIcon, TrophyIcon } from "@/components/icons";
import { ButtonLink, Container, ExternalButton, SectionHeading } from "@/components/ui";
import { events, site } from "@/lib/content";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({ description: site.description, path: "/" });

const highlightIcons = [CodeIcon, CalendarIcon, TrophyIcon];

/** Splits "Learn algorithms. Compete. Go to ICPC." so the last sentence is highlighted. */
function Headline({ text }: { text: string }) {
  const sentences = text.match(/[^.!?]+[.!?]?/g)?.map((s) => s.trim()) ?? [text];
  const last = sentences.pop();
  return (
    <h1 className="text-4xl font-bold leading-[1.1] tracking-tight sm:text-6xl">
      {sentences.map((s) => (
        <span key={s} className="block">
          {s}
        </span>
      ))}
      <span className="block text-accent">{last}</span>
    </h1>
  );
}

function TerminalDemo() {
  return (
    <div aria-hidden="true" className="overflow-hidden rounded-xl border border-border bg-surface shadow-2xl shadow-black/20">
      <div className="flex items-center gap-2 border-b border-border bg-surface-2 px-4 py-3">
        <span className="size-3 rounded-full bg-hard/70" />
        <span className="size-3 rounded-full bg-medium/70" />
        <span className="size-3 rounded-full bg-easy/70" />
        <span className="ml-2 font-mono text-xs text-muted">~/cpc-uwindsor</span>
      </div>
      <pre className="overflow-x-auto p-5 font-mono text-[13px] leading-7 sm:text-sm">
        <span className="text-accent">$</span> g++ -O2 solve.cpp -o solve{"\n"}
        <span className="text-accent">$</span> ./submit solve.cpp --judge kattis{"\n"}
        <span className="text-muted">running hidden tests...</span>{"\n"}
        <span className="text-easy">✓</span> test 1 <span className="text-muted">.... 0.01s</span>{"\n"}
        <span className="text-easy">✓</span> test 2 <span className="text-muted">.... 0.03s</span>{"\n"}
        <span className="text-easy">✓</span> test 3 <span className="text-muted">.... 0.12s</span>{"\n"}
        <span className="font-bold text-easy">Accepted</span>
        <span className="text-muted"> (3/3)</span>
        {"\n"}
        <span className="text-accent">$</span> <span className="cursor-blink text-accent">█</span>
      </pre>
    </div>
  );
}

// The moment this page was built. The countdown uses it until the visitor's clock takes over.
const builtAt = Date.now();

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-grid border-b border-border">
        <Container className="grid items-center gap-12 py-16 sm:py-24 lg:grid-cols-[1.15fr_1fr]">
          <div>
            <p className="font-mono text-sm text-muted">
              <span className="text-accent">{"//"}</span> {site.fullName}
            </p>
            <div className="mt-4">
              <Headline text={site.home.headline} />
            </div>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">{site.home.pitch}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/join" size="lg">
                Join the club <ArrowRightIcon className="size-4" />
              </ButtonLink>
              <ButtonLink href="/events" variant="secondary" size="lg">
                See events
              </ButtonLink>
            </div>
          </div>
          <TerminalDemo />
        </Container>
      </section>

      {/* What we do */}
      <section aria-labelledby="what-we-do" className="py-20">
        <Container>
          <SectionHeading id="what-we-do">What we do</SectionHeading>
          <ul className="grid gap-4 md:grid-cols-3">
            {site.home.highlights.map((h, i) => {
              const Icon = highlightIcons[i % highlightIcons.length];
              return (
                <li key={h.title} className="rounded-xl border border-border bg-surface p-6 transition-colors hover:border-accent/60">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex size-10 items-center justify-center rounded-lg bg-accent-soft text-accent">
                      <Icon />
                    </span>
                    <code className="font-mono text-xs text-muted">{h.command}</code>
                  </div>
                  <h3 className="mt-5 text-xl font-semibold">{h.title}</h3>
                  <p className="mt-2 text-muted">{h.text}</p>
                </li>
              );
            })}
          </ul>
        </Container>
      </section>

      {/* Next event */}
      <section aria-labelledby="next-event" className="border-y border-border bg-surface/40 py-20">
        <Container className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <SectionHeading id="next-event" sub="Weekly practice, workshops and club contests, all on campus and all free.">
              Next event
            </SectionHeading>
            <ButtonLink href="/events" variant="secondary">
              All events <ArrowRightIcon className="size-4" />
            </ButtonLink>
          </div>
          <NextEvent events={events} builtAt={builtAt} />
        </Container>
      </section>

      {/* ICPC callout + join */}
      <section aria-labelledby="road-to-icpc" className="py-20">
        <Container>
          <div className="relative overflow-hidden rounded-2xl border border-border bg-surface p-8 sm:p-12">
            <div aria-hidden="true" className="bg-grid absolute inset-0 opacity-60" />
            <div className="relative grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:items-center">
              <div>
                <p className="font-mono text-sm text-accent">road_to_icpc.md</p>
                <h2 id="road-to-icpc" className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                  The ICPC East Central NA Regional is hosted at UWindsor.
                </h2>
                <p className="mt-4 max-w-2xl text-muted">
                  Teams of three, one computer, five hours, a dozen problems. We train UWindsor students from their
                  first problem all the way to the regional, and we want to send more teams every year. No experience
                  needed to start.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <ButtonLink href="/join" size="lg">
                  Join the club <ArrowRightIcon className="size-4" />
                </ButtonLink>
                <ExternalButton href={site.discordUrl} variant="secondary" size="lg">
                  Join the Discord
                </ExternalButton>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
