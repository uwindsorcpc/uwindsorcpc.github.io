"use client";

import { fetchFaqs } from "@/lib/db/queries";
import type { Faq } from "@/lib/db/types";
import { useLive } from "@/lib/db/useLive";

export function FaqList({ faqs: initial }: { faqs: Faq[] }) {
  const faqs = useLive(fetchFaqs, initial);
  return (
    <div className="grid gap-3">
      {faqs.map((item, i) => (
        <details key={item.id} open={i < 2} className="group rounded-xl border border-border bg-surface open:border-accent/50">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-xl p-5 font-semibold [&::-webkit-details-marker]:hidden">
            {item.question}
            <span aria-hidden="true" className="font-mono text-accent transition-transform group-open:rotate-45">
              +
            </span>
          </summary>
          <p className="px-5 pb-5 text-muted">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}
