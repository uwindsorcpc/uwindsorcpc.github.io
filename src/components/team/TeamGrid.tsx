"use client";

import { fetchTeam } from "@/lib/db/queries";
import type { TeamLinkKey, TeamMember } from "@/lib/db/types";
import { useLive } from "@/lib/db/useLive";
import { isPlaceholder } from "@/lib/placeholder";
import { safeUrl } from "@/lib/safeUrl";
import { CodeIcon, GitHubIcon, GlobeIcon, LinkedInIcon, MailIcon, TrophyIcon } from "../icons";

const linkMeta: Record<TeamLinkKey, { label: string; Icon: typeof GitHubIcon }> = {
  github: { label: "GitHub", Icon: GitHubIcon },
  linkedin: { label: "LinkedIn", Icon: LinkedInIcon },
  codeforces: { label: "Codeforces", Icon: CodeIcon },
  kattis: { label: "Kattis", Icon: TrophyIcon },
  website: { label: "Website", Icon: GlobeIcon },
  email: { label: "Email", Icon: MailIcon },
};

function initials(name: string) {
  const words = name.replace(/[[\]]/g, "").trim().split(/\s+/).filter((w) => /^[A-Za-z]/.test(w));
  return ((words[0]?.[0] ?? "?") + (words.length > 1 ? words[words.length - 1][0] : "")).toUpperCase();
}

export function TeamGrid({ team: initial }: { team: TeamMember[] }) {
  const team = useLive(fetchTeam, initial);

  return (
    <ul className="grid gap-x-10 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
      {team.map((m) => {
        const links = (Object.entries(m.links) as [TeamLinkKey, string][])
          .filter(([key, url]) => key in linkMeta && url && !isPlaceholder(url))
          .map(([key, url]) => [key, key === "email" && !url.startsWith("mailto:") ? `mailto:${url}` : url] as const)
          .map(([key, url]) => [key, safeUrl(url)] as const)
          .filter((entry): entry is readonly [TeamLinkKey, string] => entry[1] !== null);
        const photo = safeUrl(m.photoUrl);

        return (
          <li key={m.id} className="flex flex-col">
            <div>
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element -- photos come from the database at run time
                <img
                  src={photo}
                  alt={`Photo of ${m.name}`}
                  width={80}
                  height={80}
                  loading="lazy"
                  className="aspect-square w-full max-w-[16rem] rounded-lg object-cover"
                />
              ) : (
                <div
                  role="img"
                  aria-label={`Photo placeholder for ${m.name}`}
                  className="headline flex aspect-square w-full max-w-[16rem] items-center justify-center rounded-lg bg-surface text-7xl text-muted/60"
                >
                  {initials(m.name)}
                </div>
              )}
              <div className="mt-5 min-w-0">
                <h2 className="condensed text-2xl font-bold leading-tight">{m.name}</h2>
                <p className="mt-0.5 text-accent">{m.role}</p>
              </div>
            </div>
            {m.bio && <p className="mt-3 max-w-sm leading-relaxed text-muted">{m.bio}</p>}
            {links.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-1" aria-label={`${m.name}'s links`}>
                {links.map(([key, href]) => {
                  const { label, Icon } = linkMeta[key];
                  const external = key !== "email";
                  return (
                    <li key={key}>
                      <a
                        href={href}
                        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                        aria-label={`${m.name} on ${label}${external ? " (opens in a new tab)" : ""}`}
                        title={label}
                        className="inline-flex size-10 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface hover:text-fg"
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
  );
}
