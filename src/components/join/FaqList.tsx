"use client";

import { fetchFaqs } from "@/lib/db/queries";
import type { Faq } from "@/lib/db/types";
import { useLive } from "@/lib/db/useLive";

export function FaqList({ faqs: initial }: { faqs: Faq[] }) {
  const faqs = useLive(fetchFaqs, initial);
  return (
    <div className="divide-y divide-border border-y border-border">
      {faqs.map((item, i) => (
        <details key={item.id} open={i < 2} className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-lg font-semibold [&::-webkit-details-marker]:hidden">
            {item.question}
            <span aria-hidden="true" className="text-2xl font-light text-accent transition-transform group-open:rotate-45">
              +
            </span>
          </summary>
          <p className="max-w-3xl pb-6 leading-relaxed text-muted">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}
