import type { ReactNode } from "react";

/** Judge-style result banner: Accepted, Runtime Error, Wrong Answer… */
const tones = {
  ok: "border-easy/50 bg-easy/10 text-easy",
  error: "border-hard/50 bg-hard/10 text-hard",
  warn: "border-medium/50 bg-medium/10 text-medium",
};

export function Verdict({
  tone,
  verdict,
  children,
}: {
  tone: keyof typeof tones;
  verdict: string;
  children?: ReactNode;
}) {
  return (
    <div role={tone === "ok" ? "status" : "alert"} className={`rounded-xl border p-5 ${tones[tone]}`}>
      <p className="font-mono text-lg font-bold">{verdict}</p>
      {children && <div className="mt-2 text-sm text-fg">{children}</div>}
    </div>
  );
}
