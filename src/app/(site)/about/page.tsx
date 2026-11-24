import { ButtonLink, Container, PageHeader } from "@/components/ui";
import { readMarkdown } from "@/lib/content";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "About",
  description:
    "What competitive programming is, why it's worth learning (interviews, problem solving, ICPC), and the mission of CPC UWindsor.",
  path: "/about",
});

export default function AboutPage() {
  // Text lives in content/about.md
  const html = readMarkdown("about.md");

  return (
    <>
      <PageHeader
        title="About the club"
        intro="New to competitive programming? Start here. No jargon, no prerequisites."
      />
      <Container className="py-16">
        <div className="grid gap-12 lg:grid-cols-[1fr_280px]">
          <article className="prose-content max-w-3xl" dangerouslySetInnerHTML={{ __html: html }} />
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="border-t-2 border-accent pt-5">
              <p className="font-semibold">Where to go next</p>
              <ul className="mt-4 grid gap-3 text-sm">
                <li>
                  <ButtonLink href="/resources" variant="secondary" className="w-full">
                    Beginner roadmap
                  </ButtonLink>
                </li>
                <li>
                  <ButtonLink href="/events" variant="secondary" className="w-full">
                    Upcoming events
                  </ButtonLink>
                </li>
                <li>
                  <ButtonLink href="/join" className="w-full">
                    Join the club
                  </ButtonLink>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </Container>
    </>
  );
}
