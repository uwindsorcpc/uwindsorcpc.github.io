import Link from "next/link";
import type { ReactNode } from "react";

import { isPlaceholder } from "@/lib/placeholder";
import { ExternalIcon } from "./icons";

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-6xl px-4 sm:px-6 ${className}`}>{children}</div>;
}

/** Page title: a big condensed headline with an optional intro line. */
export function PageHeader({ title, intro }: { title: string; intro?: ReactNode }) {
  return (
    <div className="border-b border-border">
      <Container className="pt-16 pb-12 sm:pt-24 sm:pb-16">
        <h1 className="headline text-6xl sm:text-8xl">{title}</h1>
        {intro && <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted sm:text-xl">{intro}</p>}
      </Container>
    </div>
  );
}

export function SectionHeading({ id, children, sub }: { id?: string; children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mb-8 max-w-2xl">
      <h2 id={id} className="condensed scroll-mt-24 text-3xl font-bold tracking-tight sm:text-4xl">
        {children}
      </h2>
      {sub && <p className="mt-2 text-muted">{sub}</p>}
    </div>
  );
}

const buttonStyles = {
  primary: "bg-button text-on-accent hover:bg-button-hover",
  secondary: "border border-border text-fg hover:border-fg/60",
};

const buttonSizes = {
  md: "px-5 py-2.5 text-sm",
  lg: "px-6 py-3.5 text-base",
};

type ButtonProps = {
  href: string;
  children: ReactNode;
  variant?: keyof typeof buttonStyles;
  size?: keyof typeof buttonSizes;
  className?: string;
};

function buttonClass(variant: keyof typeof buttonStyles, size: keyof typeof buttonSizes, className: string) {
  return `inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors ${buttonStyles[variant]} ${buttonSizes[size]} ${className}`;
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
