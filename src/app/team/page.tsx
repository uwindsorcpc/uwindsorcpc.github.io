import Image from "next/image";

import { CodeIcon, GitHubIcon, GlobeIcon, LinkedInIcon, MailIcon, TrophyIcon } from "@/components/icons";
import { Container, PageHeader } from "@/components/ui";
import { isPlaceholder, team, type TeamLinks } from "@/lib/content";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Team",
  description: "Meet the CPC UWindsor executive team: ICPC contestants who run the club's practices, workshops and contests.",
  path: "/team",
});

const linkMeta: Record<keyof TeamLinks, { label: string; Icon: typeof GitHubIcon }> = {
  github: { label: "GitHub", Icon: GitHubIcon },
  linkedin: { label: "LinkedIn", Icon: LinkedInIcon },
  codeforces: { label: "Codeforces", Icon: CodeIcon },
  kattis: { label: "Kattis", Icon: TrophyIcon },
  website: { label: "Website", Icon: GlobeIcon },
  email: { label: "Email", Icon: MailIcon },
};

function initials(name: string) {
  const clean = name.replace(/[\[\]]/g, "").trim();
  const words = clean.split(/\s+/).filter((w) => /^[A-Za-z]/.test(w));
  return ((words[0]?.[0] ?? "?") + (words.length > 1 ? words[words.length - 1][0] : "")).toUpperCase();
}

export default function TeamPage() {
  return (
    <>
      <PageHeader
        command="whoami --all"
        title="The team"
        intro="CPC UWindsor was started by three UWindsor ICPC contestants. Say hi at any practice night, or message us on Discord."
      />
      <Container className="py-14">
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {team.map((m) => {
            const links = (Object.entries(m.links ?? {}) as [keyof TeamLinks, string][]).filter(
              ([key, url]) => key in linkMeta && !isPlaceholder(url),
            );
            return (
              <li key={m.name + m.role} className="flex flex-col rounded-xl border border-border bg-surface p-6">
                <div className="flex items-center gap-4">
                  {m.photo ? (
                    <Image
                      src={m.photo}
                      alt={`Photo of ${m.name}`}
                      width={80}
                      height={80}
                      className="size-20 rounded-xl border border-border object-cover"
                    />
                  ) : (
                    <div
                      role="img"
                      aria-label={`Photo placeholder for ${m.name}`}
                      className="bg-grid flex size-20 shrink-0 items-center justify-center rounded-xl border border-dashed border-border bg-surface-2 font-mono text-2xl font-bold text-accent"
                    >
                      {initials(m.name)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold leading-snug">{m.name}</h2>
                    <p className="font-mono text-sm text-accent">{m.role}</p>
                  </div>
                </div>
                {m.bio && <p className="mt-4 text-sm text-muted">{m.bio}</p>}
                {links.length > 0 && (
                  <ul className="mt-auto flex flex-wrap gap-2 pt-5" aria-label={`${m.name}'s links`}>
                    {links.map(([key, url]) => {
                      const { label, Icon } = linkMeta[key];
                      const href = key === "email" && !url.startsWith("mailto:") ? `mailto:${url}` : url;
                      const external = key !== "email";
                      return (
                        <li key={key}>
                          <a
                            href={href}
                            {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                            aria-label={`${m.name} on ${label}${external ? " (opens in a new tab)" : ""}`}
                            title={label}
                            className="inline-flex size-10 items-center justify-center rounded-lg border border-border text-muted transition-colors hover:border-accent hover:text-accent"
                          >
                            <Icon />
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </Container>
    </>
  );
}
