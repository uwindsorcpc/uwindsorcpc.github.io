"use client";

import { useRef, useState } from "react";
import { CheckIcon, CopyIcon } from "./icons";

type Tab = { id: string; label: string; filename: string; code: string };

/** Tabbed code viewer with a copy button. Arrow keys move between tabs. */
export function CodeTabs({ tabs }: { tabs: Tab[] }) {
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState(false);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const tab = tabs[active];

  const select = (i: number) => {
    setActive(i);
    setCopied(false);
    tabRefs.current[i]?.focus();
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(tab.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked: the code is still selectable by hand */
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex items-center justify-between gap-2 border-b border-border bg-surface-2 pr-2">
        <div role="tablist" aria-label="Starter template language" className="flex">
          {tabs.map((t, i) => (
            <button
              key={t.id}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={i === active}
              aria-controls={`panel-${t.id}`}
              tabIndex={i === active ? 0 : -1}
              onClick={() => select(i)}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight") select((i + 1) % tabs.length);
                if (e.key === "ArrowLeft") select((i - 1 + tabs.length) % tabs.length);
              }}
              className="border-b-2 border-transparent px-4 py-3 font-mono text-sm text-muted transition-colors hover:text-fg aria-selected:border-accent aria-selected:text-fg"
            >
              {t.filename}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 font-mono text-xs text-muted transition-colors hover:bg-surface hover:text-fg"
        >
          {copied ? <CheckIcon className="size-4 text-accent" /> : <CopyIcon className="size-4" />}
          <span aria-live="polite">{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>
      <div role="tabpanel" id={`panel-${tab.id}`} aria-labelledby={`tab-${tab.id}`} tabIndex={0}>
        <pre className="overflow-x-auto p-5 font-mono text-[13px] leading-6">
          <code>{tab.code}</code>
        </pre>
      </div>
    </div>
  );
}
