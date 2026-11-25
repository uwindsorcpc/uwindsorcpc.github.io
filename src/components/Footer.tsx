import Link from "next/link";

import { isPlaceholder, site } from "@/lib/content";
import { NAV_LINKS } from "@/lib/nav";
import { Logo } from "./Logo";
import { Container } from "./ui";
import { MailIcon, socialIcons } from "./icons";

export function Footer() {
  const socials = site.socials.filter((s) => !isPlaceholder(s.url));
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border">
      <Container className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <Logo className="h-8" />
          <p className="mt-4 max-w-sm text-sm text-muted">
            {site.fullName}. A student-run, non-commercial club at the University of Windsor.
          </p>
        </div>

        <nav aria-label="Footer">
          <h2 className="text-sm font-semibold text-fg">Pages</h2>
          <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {[...NAV_LINKS, { href: "/join", label: "Join" }].map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-muted transition-colors hover:text-accent">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="text-sm font-semibold text-fg">Contact</h2>
          <p className="mt-3 text-sm">
            {isPlaceholder(site.email) ? (
              <span className="inline-flex items-center gap-2 text-muted">
                <MailIcon className="size-4" /> {site.email}
              </span>
            ) : (
              <a href={`mailto:${site.email}`} className="inline-flex items-center gap-2 text-muted transition-colors hover:text-accent">
                <MailIcon className="size-4" /> {site.email}
              </a>
            )}
          </p>
          {/* Only links that are filled in (not "[PLACEHOLDER]") are shown. */}
          {socials.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2" aria-label="Social links">
              {socials.map((s) => {
                const Icon = socialIcons[s.icon] ?? socialIcons.website;
                return (
                  <li key={s.label}>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${s.label} (opens in a new tab)`}
                      className="inline-flex size-10 items-center justify-center rounded-md border border-border text-muted transition-colors hover:border-fg/60 hover:text-fg"
                    >
                      <Icon />
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </Container>
      <div className="border-t border-border">
        <Container className="flex flex-col gap-2 py-5 text-sm text-muted sm:flex-row sm:justify-between">
          <p>© {year} {site.name}</p>
          <p>Free to join. Run by students.</p>
        </Container>
      </div>
    </footer>
  );
}
