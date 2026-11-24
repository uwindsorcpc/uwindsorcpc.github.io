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
        command="man competitive-programming"
        title="Resources"
        intro="Everything you need to go from your first problem to the ICPC regional. Everything here is free."
      />

      <Container className="py-14">
        <section aria-labelledby="roadmap" className="mb-20">
          <SectionHeading id="roadmap" sub="Not sure where to start? Follow these steps in order.">
            Beginner roadmap
          </SectionHeading>
          <ol className="relative grid gap-6 border-l border-border pl-8 sm:pl-10">
            {resources.roadmap.map((step, i) => (
              <li key={step.title} className="relative">
                <span
                  aria-hidden="true"
                  className="absolute top-0 -left-[calc(2rem+1px)] flex size-8 -translate-x-1/2 items-center justify-center rounded-full border border-accent bg-bg font-mono text-sm font-bold text-accent sm:-left-[calc(2.5rem+1px)]"
                >
                  {i + 1}
                </span>
                <div className="rounded-xl border border-border bg-surface p-6">
                  {step.duration && <p className="font-mono text-xs text-muted">{step.duration}</p>}
                  <h3 className="mt-1 text-lg font-semibold">
                    <span className="sr-only">Step {i + 1}: </span>
                    {step.title}
                  </h3>
                  <p className="mt-2 text-muted">{step.text}</p>
                  {step.links && step.links.length > 0 && (
                    <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
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
          <ul className="grid gap-4 sm:grid-cols-2">
            {resources.platforms.map((p) => (
              <li key={p.name}>
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block h-full rounded-xl border border-border bg-surface p-6 transition-colors hover:border-accent"
                >
                  <span className="flex items-center justify-between">
                    <span className="font-mono text-lg font-bold group-hover:text-accent">{p.name}</span>
                    <ExternalIcon className="size-4 text-muted group-hover:text-accent" />
                  </span>
                  <span className="mt-2 block text-sm text-muted">{p.text}</span>
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="books" className="mb-20">
          <SectionHeading id="books">Books and guides</SectionHeading>
          <ul className="grid gap-4 md:grid-cols-3">
            {resources.books.map((b) => (
              <li key={b.name} className="rounded-xl border border-border bg-surface p-6">
                <h3 className="font-semibold">
                  <ExternalLink href={b.url}>{b.name}</ExternalLink>
                </h3>
                {b.author && <p className="mt-1 font-mono text-xs text-muted">{b.author}</p>}
                <p className="mt-3 text-sm text-muted">{b.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="templates">
          <SectionHeading
            id="templates"
            sub="Copy one, then write your solution in main(). Each shows the fast way to read input and print output in that language, which matters on big test cases. The comments explain why."
          >
            Starter templates
          </SectionHeading>
          <CodeTabs tabs={templates} />
        </section>
      </Container>
    </>
  );
}
