"use client";

import { useState } from "react";

import { Logo } from "../Logo";
import { ThemeToggle } from "../ThemeToggle";
import { ResourceManager } from "./ResourceManager";
import { RESOURCES } from "./resources";
import { secondaryBtn } from "./styles";

export function Dashboard({ email, onSignOut }: { email: string; onSignOut: () => void }) {
  const [active, setActive] = useState(RESOURCES[0].key);
  const def = RESOURCES.find((r) => r.key === active) ?? RESOURCES[0];

  return (
    <div className="min-h-dvh">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="rounded-md border border-accent/50 bg-accent-soft px-2 py-0.5 font-mono text-xs text-accent">admin</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden font-mono text-xs text-muted sm:inline">{email}</span>
            <a href="/" target="_blank" rel="noopener" className={`${secondaryBtn} px-3 py-1.5 text-xs`}>
              View site
            </a>
            <ThemeToggle />
            <button type="button" onClick={onSignOut} className={`${secondaryBtn} px-3 py-1.5 text-xs`}>
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <nav aria-label="Admin sections" className="mb-8 flex flex-wrap gap-2">
          {RESOURCES.map((r) => (
            <button
              key={r.key}
              type="button"
              aria-pressed={r.key === active}
              onClick={() => setActive(r.key)}
              className="rounded-lg border border-border bg-surface px-4 py-2 font-mono text-sm text-muted transition-colors hover:text-fg aria-pressed:border-accent aria-pressed:bg-accent-soft aria-pressed:text-fg"
            >
              {r.title}
            </button>
          ))}
        </nav>

        <h1 className="mb-6 text-2xl font-bold">{def.title}</h1>
        {/* key resets the editor when switching sections */}
        <ResourceManager key={def.key} def={def} />

        <p className="mt-10 font-mono text-xs text-muted">
          Changes appear on the public site right away. You&apos;ll be signed out after 30 minutes without activity.
        </p>
      </div>
    </div>
  );
}
