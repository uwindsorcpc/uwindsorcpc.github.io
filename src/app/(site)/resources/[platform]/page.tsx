import Link from "next/link";

import { ExternalIcon } from "@/components/icons";
import { ProblemSetView } from "@/components/resources/ProblemSetView";
import { Container, ExternalButton, PageHeader, SectionHeading } from "@/components/ui";
import { resources } from "@/lib/content";
import { fetchProblems } from "@/lib/db/queries";
import { PLATFORMS, type Platform } from "@/lib/db/types";
import { pageMetadata } from "@/lib/metadata";

// One static page per platform: /resources/kattis, /resources/codeforces, /resources/leetcode.
export const dynamicParams = false;
export function generateStaticParams() {
  return PLATFORMS.map((platform) => ({ platform }));
}

export async function generateMetadata({ params }: { params: Promise<{ platform: string }> }) {
  const { platform } = await params;
  const page = resources.platformPages[platform as Platform];
  return pageMetadata({
    title: `${page.name} practice problems`,
    description: `Hand-picked ${page.name} problems from UWindsor CPC, sorted into easy, medium and hard, plus tips for getting started on ${page.name}.`,
    path: `/resources/${platform}`,
  });
}

export default async function PlatformPage({ params }: { params: Promise<{ platform: string }> }) {
  const { platform } = (await params) as { platform: Platform };
  const page = resources.platformPages[platform];
  const problems = await fetchProblems();
  const others = PLATFORMS.filter((p) => p !== platform);

  return (
    <>
      <PageHeader title={page.name} intro={page.intro} />
      <Container className="py-16">
        <p className="mb-10 text-sm text-muted">
          <Link href="/resources" className="text-accent underline underline-offset-4">
            Resources
          </Link>{" "}
          / {page.name}
        </p>

        <section aria-labelledby="getting-started" className="mb-20 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-start">
          <div>
            <SectionHeading id="getting-started">Getting started</SectionHeading>
            <ol className="max-w-2xl list-decimal space-y-3 pl-5 leading-relaxed text-muted marker:text-accent">
              {page.tips.map((tip) => (
                <li key={tip} className="pl-1">
                  {tip}
                </li>
              ))}
            </ol>
          </div>
          <ExternalButton href={page.url} size="lg">
            Open {page.name}
          </ExternalButton>
        </section>

        <section aria-labelledby="problems">
          <SectionHeading id="problems" sub="Picked by the execs. Start with easy and move up when they start to feel routine.">
            Practice problems
          </SectionHeading>
          <ProblemSetView platform={platform} initial={problems} />
        </section>

        <nav aria-label="Other platforms" className="mt-20 border-t border-border pt-8">
          <p className="text-sm text-muted">Other platforms</p>
          <ul className="mt-3 flex flex-wrap gap-x-8 gap-y-2">
            {others.map((p) => (
              <li key={p}>
                <Link href={`/resources/${p}`} className="condensed text-2xl font-bold hover:text-accent">
                  {resources.platformPages[p].name}
                </Link>
              </li>
            ))}
            <li>
              <a href="https://cses.fi/problemset/" target="_blank" rel="noopener noreferrer" className="condensed inline-flex items-center gap-1.5 text-2xl font-bold hover:text-accent">
                CSES <ExternalIcon className="size-4" />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </li>
          </ul>
        </nav>
      </Container>
    </>
  );
}
