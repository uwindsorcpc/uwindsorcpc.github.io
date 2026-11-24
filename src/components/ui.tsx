import Link from "next/link";
import type { ReactNode } from "react";

import { isPlaceholder } from "@/lib/placeholder";
import { ExternalIcon } from "./icons";

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-6xl px-4 sm:px-6 ${className}`}>{children}</div>;
}

/** Page title block with a terminal-style command above the heading. */
export function PageHeader({ command, title, intro }: { command: string; title: string; intro?: ReactNode }) {
  return (
    <div className="bg-grid border-b border-border">
      <Container className="py-14 sm:py-20">
        <p className="font-mono text-sm text-muted">
          <span className="text-accent">$</span> {command}
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">{title}</h1>
        {intro && <p className="mt-4 max-w-2xl text-lg text-muted">{intro}</p>}
      </Container>
    </div>
  );
}

export function SectionHeading({ id, children, sub }: { id?: string; children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mb-8">
      <h2 id={id} className="scroll-mt-24 font-mono text-2xl font-bold tracking-tight">
        <span aria-hidden="true" className="text-accent">
          ##{" "}
        </span>
        {children}
      </h2>
      {sub && <p className="mt-2 text-muted">{sub}</p>}
    </div>
  );
}

const buttonStyles = {
  primary: "bg-accent text-on-accent hover:bg-accent-strong",
  secondary: "border border-border bg-surface text-fg hover:border-accent",
};

const buttonSizes = {
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-4 text-base",
};

type ButtonProps = {
  href: string;
  children: ReactNode;
  variant?: keyof typeof buttonStyles;
  size?: keyof typeof buttonSizes;
  className?: string;
};

function buttonClass(variant: keyof typeof buttonStyles, size: keyof typeof buttonSizes, className: string) {
  return `inline-flex items-center justify-center gap-2 rounded-lg font-mono font-semibold transition-colors ${buttonStyles[variant]} ${buttonSizes[size]} ${className}`;
}

/** Button-styled link to a page on this site. */
export function ButtonLink({ href, children, variant = "primary", size = "md", className = "" }: ButtonProps) {
  return (
    <Link href={href} className={buttonClass(variant, size, className)}>
      {children}
    </Link>
  );
}

/**
 * Button-styled link to another website. If the URL is still a
 * "[PLACEHOLDER]" from the sample content, it shows a disabled button instead
 * of a broken link.
 */
export function ExternalButton({ href, children, variant = "primary", size = "md", className = "" }: ButtonProps) {
  if (isPlaceholder(href)) {
    return (
      <span
        aria-disabled="true"
        title={`Link not set yet: replace ${href} in /content`}
        className={`${buttonClass("secondary", size, className)} cursor-not-allowed opacity-60`}
      >
        {children}
        <span className="text-xs font-normal text-muted">(link coming soon)</span>
      </span>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={buttonClass(variant, size, className)}>
      {children}
      <ExternalIcon className="size-4" />
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}

/** Plain text link to another website, opening in a new tab. */
export function ExternalLink({ href, children, className = "" }: { href: string; children: ReactNode; className?: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`text-accent underline decoration-accent/40 underline-offset-4 transition-colors hover:decoration-accent ${className}`}
    >
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

export function Card({ children, className = "", as: Tag = "div" }: { children: ReactNode; className?: string; as?: "div" | "article" | "li" }) {
  return <Tag className={`rounded-xl border border-border bg-surface p-6 ${className}`}>{children}</Tag>;
}
