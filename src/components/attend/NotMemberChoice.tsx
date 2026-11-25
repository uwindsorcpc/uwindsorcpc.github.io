"use client";

import { useRouter } from "next/navigation";

import { savePrefill } from "@/lib/attendance";
import { primaryBtn, secondaryBtn } from "../admin/styles";

/**
 * "Runtime Error: you are not a registered member." Offers to sign up (with
 * name and email carried over, outside the URL) or to continue as a guest.
 */
export function NotMemberChoice({
  headingId,
  fullName,
  email,
  returnTo,
  returnLabel,
  onGuest,
  onCancel,
  busy,
}: {
  headingId: string;
  fullName: string;
  email: string;
  returnTo: string;
  returnLabel: string;
  onGuest: () => void;
  onCancel: () => void;
  busy: boolean;
}) {
  const router = useRouter();
  return (
    <div>
      <p className="font-mono text-sm text-hard">RuntimeError</p>
      <h2 id={headingId} className="condensed mt-1 text-2xl font-bold">
        You&apos;re not a registered member
      </h2>
      <p className="mt-3 text-sm text-muted">
        We couldn&apos;t find <span className="font-mono text-fg">{email}</span> in the member list. Would you like to sign
        up? It takes a minute, and your name and email are already filled in.
      </p>
      <div className="mt-6 grid gap-3">
        <button
          type="button"
          className={primaryBtn}
          onClick={() => {
            savePrefill({ fullName, email, returnTo, returnLabel });
            router.push("/join#signup");
          }}
        >
          Yes, sign me up
        </button>
        <button type="button" className={secondaryBtn} onClick={onGuest} disabled={busy}>
          {busy ? "Joining…" : "No thanks, continue as a guest"}
        </button>
        <button type="button" onClick={onCancel} className="text-sm text-muted underline underline-offset-4 hover:text-fg">
          Cancel
        </button>
      </div>
    </div>
  );
}
