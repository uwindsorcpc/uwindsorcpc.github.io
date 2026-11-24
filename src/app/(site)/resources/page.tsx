import Link from "next/link";

import { CodeTabs } from "@/components/CodeTabs";
import { ExternalIcon } from "@/components/icons";
import { Container, ExternalLink, PageHeader, SectionHeading } from "@/components/ui";
import { readTemplate, resources } from "@/lib/content";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Resources",
  description:
    "A beginner roadmap for competitive programming, the best practice sites (Kattis, Codeforces, LeetCode, CSES), free books, and C++, Java and Python starter templates.",
  path: "/resources",
});

function SmartLink({ href, children }: { href: string; children: React.ReactNode }) {
  if (href.startsWith("/")) {
    return (
      <Link href={href} className="text-accent underline decoration-accent/40 underline-offset-4 hover:decoration-accent">
        {children}
      </Link>
    );
  }
  return <ExternalLink href={href}>{children}</ExternalLink>;
}

export default function ResourcesPage() {
  const templates = [
    { id: "cpp", label: "C++", filename: "template.cpp", code: readTemplate("template.cpp") },
    { id: "java", label: "Java", filename: "Main.java", code: readTemplate("template.java") },
    { id: "py", label: "Python", filename: "template.py", code: readTemplate("template.py") },
  ];

  return (
    <>
      <PageHeader
        title="Resources"
        intro="Everything you need to go from your first problem to the ICPC regional. Everything here is free."
      />

      <Container className="py-16">
        <section aria-labelledby="roadmap" className="mb-20">
          <SectionHeading id="roadmap" sub="Not sure where to start? Follow these steps in order.">
            Beginner roadmap
          </SectionHeading>
          <ol className="grid border-t border-border">
            {resources.roadmap.map((step, i) => (
              <li key={step.title} className="grid gap-4 border-b border-border py-8 sm:grid-cols-[6rem_1fr] sm:gap-8">
                <div aria-hidden="true">
                  <span className="headline block text-6xl text-accent">{i + 1}</span>
                  {step.duration && <span className="mt-2 block text-sm text-muted">{step.duration}</span>}
                </div>
                <div className="max-w-2xl">
                  <h3 className="condensed text-2xl font-bold">
                    <span className="sr-only">Step {i + 1}: </span>
                    {step.title}
                  </h3>
                  {step.duration && <p className="sr-only">{step.duration}</p>}
                  <p className="mt-2 leading-relaxed text-muted">{step.text}</p>
                  {step.links && step.links.length > 0 && (
                    <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-1">
                      {step.links.map((l) => (
                        <li key={l.url + l.label}>
                          <SmartLink href={l.url}>{l.label}</SmartLink>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="platforms" className="mb-20">
          <SectionHeading id="platforms" sub="Where to practise. Make an account on Kattis and Codeforces first.">
            Practice platforms
          </SectionHeading>
          <ul className="divide-y divide-border border-y border-border">
            {resources.platforms.map((p) => (
              <li key={p.name}>
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group grid gap-1 py-6 sm:grid-cols-[14rem_1fr_auto] sm:items-baseline sm:gap-8"
                >
                  <span className="condensed text-2xl font-bold group-hover:text-accent">{p.name}</span>
                  <span className="leading-relaxed text-muted">{p.text}</span>
                  <ExternalIcon className="hidden size-4 text-muted group-hover:text-accent sm:block" />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="books" className="mb-20">
          <SectionHeading id="books">Books and guides</SectionHeading>
          <ul className="grid gap-10 md:grid-cols-3">
            {resources.books.map((b) => (
              <li key={b.name} className="border-t-2 border-border pt-5">
                <h3 className="text-lg font-semibold">
                  <ExternalLink href={b.url}>{b.name}</ExternalLink>
                </h3>
                {b.author && <p className="mt-1 text-sm text-muted">{b.author}</p>}
                <p className="mt-3 leading-relaxed text-muted">{b.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="templates">
          <SectionHeading
            id="templates"
            sub="Standard boilerplate with fast input/output. Copy one and write your code where it says solution."
          >
            Starter templates
          </SectionHeading>
          <CodeTabs tabs={templates} />
        </section>
      </Container>
    </>
  );
}
