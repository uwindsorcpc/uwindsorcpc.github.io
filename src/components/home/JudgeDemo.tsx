"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/*
 * Home page animation: one problem, four attempts. Code is typed into an
 * editor, submitted, and judged: TLE → WA → RTE → Accepted. Between attempts
 * only the changed lines are edited, like a real fix. Purely decorative:
 * hidden from screen readers (a text summary is provided), paused when off
 * screen, and shown as the finished Accepted solution for reduced motion.
 */

const SKELETON = [
  "#include <bits/stdc++.h>",
  "using namespace std;",
  "",
  "int main() {",
  "  // solution",
  "}",
];

type Verdict = { code: "AC" | "WA" | "TLE" | "RTE"; title: string; detail: string; failTest?: number };

const ATTEMPTS: { lines: string[]; verdict: Verdict }[] = [
  {
    lines: [
      "#include <bits/stdc++.h>",
      "using namespace std;",
      "",
      "int main() {",
      "  int n, q;",
      "  cin >> n >> q;",
      "  vector<int> a(n);",
      "  for (auto &x : a) cin >> x;",
      "  while (q--) {",
      "    int l, r;",
      "    cin >> l >> r;",
      "    long long s = 0;",
      "    for (int i = l-1; i < r; i++)",
      "      s += a[i];",
      "    cout << s << '\\n';",
      "  }",
      "}",
    ],
    verdict: {
      code: "TLE",
      title: "Time Limit Exceeded on test 5",
      detail: "n·q = 4·10¹⁰ steps. The budget is ~10⁸ per second. Try prefix sums.",
      failTest: 5,
    },
  },
  {
    lines: [
      "#include <bits/stdc++.h>",
      "using namespace std;",
      "",
      "int main() {",
      "  int n, q;",
      "  cin >> n >> q;",
      "  vector<int> p(n + 1);",
      "  for (int i = 1; i <= n; i++) {",
      "    cin >> p[i];",
      "    p[i] += p[i-1];",
      "  }",
      "  while (q--) {",
      "    int l, r;",
      "    cin >> l >> r;",
      "    cout << p[r] - p[l-1] << '\\n';",
      "  }",
      "}",
    ],
    verdict: {
      code: "WA",
      title: "Wrong Answer on test 7",
      detail: "expected 199999999800000, got 552694464. The int overflowed.",
      failTest: 7,
    },
  },
  {
    lines: [
      "#include <bits/stdc++.h>",
      "using namespace std;",
      "",
      "int main() {",
      "  int n, q;",
      "  cin >> n >> q;",
      "  vector<long long> p(n);",
      "  for (int i = 1; i <= n; i++) {",
      "    cin >> p[i];",
      "    p[i] += p[i-1];",
      "  }",
      "  while (q--) {",
      "    int l, r;",
      "    cin >> l >> r;",
      "    cout << p[r] - p[l-1] << '\\n';",
      "  }",
      "}",
    ],
    verdict: {
      code: "RTE",
      title: "Run Time Error on test 1",
      detail: "p[n] is out of bounds: p only has n elements (0 … n-1).",
      failTest: 1,
    },
  },
  {
    lines: [
      "#include <bits/stdc++.h>",
      "using namespace std;",
      "",
      "int main() {",
      "  int n, q;",
      "  cin >> n >> q;",
      "  vector<long long> p(n + 1);",
      "  for (int i = 1; i <= n; i++) {",
      "    cin >> p[i];",
      "    p[i] += p[i-1];",
      "  }",
      "  while (q--) {",
      "    int l, r;",
      "    cin >> l >> r;",
      "    cout << p[r] - p[l-1] << '\\n';",
      "  }",
      "}",
    ],
    verdict: { code: "AC", title: "Accepted", detail: "All 24 tests passed · 0.11 s · 4 MB" },
  },
];

const TOTAL_TESTS = 24;
const MAX_LINES = 17;

/* ---------------------------- line diff (LCS) ---------------------------- */

type Op = { kind: "keep" } | { kind: "del" } | { kind: "ins"; text: string };

function diff(a: string[], b: string[]): Op[] {
  const dp = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--)
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const ops: Op[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) {
      ops.push({ kind: "keep" });
      i++;
      j++;
    } else if (i < a.length && (j === b.length || dp[i + 1][j] >= dp[i][j + 1])) {
      // Delete before inserting, like a person replacing a line.
      ops.push({ kind: "del" });
      i++;
    } else {
      ops.push({ kind: "ins", text: b[j++] });
    }
  }
  return ops;
}

/* ------------------------------ highlighting ----------------------------- */

const TOKEN =
  /(\/\/.*$)|('(?:\\.|[^'])*')|(#include\s*<[^>]*>)|\b(int|long|using|namespace|while|for|auto|return|vector)\b|\b(cin|cout|std)\b|\b(\d+)\b/g;

function highlight(line: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of line.matchAll(TOKEN)) {
    if (m.index > last) out.push(line.slice(last, m.index));
    const cls = m[1]
      ? "text-muted"
      : m[2]
        ? "text-medium"
        : m[3]
          ? "text-hard"
          : m[4]
            ? "text-practice"
            : m[5]
              ? "text-accent"
              : "text-workshop";
    out.push(
      <span key={m.index} className={cls}>
        {m[0]}
      </span>,
    );
    last = m.index + m[0].length;
  }
  if (last < line.length) out.push(line.slice(last));
  return out;
}

/* -------------------------------- component ------------------------------- */

type Phase = "typing" | "submitting" | "running" | "verdict";
type State = {
  lines: string[];
  caret: { line: number; col: number };
  phase: Phase;
  attempt: number;
  test: number;
  verdict: Verdict | null;
};

const verdictStyle: Record<Verdict["code"], string> = {
  AC: "border-easy/50 bg-easy/10 text-easy",
  WA: "border-hard/50 bg-hard/10 text-hard",
  TLE: "border-medium/50 bg-medium/10 text-medium",
  RTE: "border-practice/50 bg-practice/10 text-practice",
};

const FINAL: State = {
  lines: ATTEMPTS[3].lines,
  caret: { line: -1, col: 0 },
  phase: "verdict",
  attempt: 3,
  test: TOTAL_TESTS,
  verdict: ATTEMPTS[3].verdict,
};

const INITIAL: State = {
  lines: SKELETON,
  caret: { line: 4, col: SKELETON[4].length },
  phase: "typing",
  attempt: 0,
  test: 0,
  verdict: null,
};

export function JudgeDemo() {
  const [state, setState] = useState<State>(INITIAL);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let visible = true;
    const root = rootRef.current;
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    if (root) io.observe(root);

    // Waits `ms`, and keeps waiting while the demo is off screen or the tab is hidden.
    const sleep = async (ms: number) => {
      await new Promise((r) => setTimeout(r, ms));
      while (!cancelled && (!visible || document.hidden)) await new Promise((r) => setTimeout(r, 300));
      if (cancelled) throw new Error("cancelled");
    };

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    async function run() {
      if (reduced) {
        await sleep(0);
        setState(FINAL);
        return;
      }
      for (;;) {
        let lines = [...SKELETON];
        setState({ ...INITIAL });
        await sleep(900);

        for (let a = 0; a < ATTEMPTS.length; a++) {
          const target = ATTEMPTS[a].lines;
          const ops = diff(lines, target);

          // Pass 1: delete the lines being replaced (bottom-up isn't needed:
          // positions only count lines that are kept or still to delete).
          let pos = 0;
          for (const op of ops) {
            if (op.kind === "keep") pos++;
            if (op.kind !== "del") continue;
            let text = lines[pos];
            while (text.length > 0) {
              text = text.slice(0, -2);
              lines = lines.map((l, k) => (k === pos ? text : l));
              const snapshot = lines;
              const line = pos;
              setState((s) => ({ ...s, lines: snapshot, caret: { line, col: text.length } }));
              await sleep(12);
            }
            lines = lines.filter((_, k) => k !== pos);
            const snapshot = lines;
            const prev = Math.max(0, pos - 1);
            setState((s) => ({ ...s, lines: snapshot, caret: { line: prev, col: snapshot[prev]?.length ?? 0 } }));
            await sleep(60);
          }

          // Pass 2: type the new lines in place.
          pos = 0;
          for (const op of ops) {
            if (op.kind === "keep") pos++;
            if (op.kind !== "ins") continue;
            lines = [...lines.slice(0, pos), "", ...lines.slice(pos)];
            for (let c = 1; c <= op.text.length; c++) {
              const typed = op.text.slice(0, c);
              lines = lines.map((l, k) => (k === pos ? typed : l));
              const snapshot = lines;
              const line = pos;
              setState((s) => ({ ...s, lines: snapshot, caret: { line, col: c } }));
              await sleep(op.text[c - 1] === " " ? 10 : 22 + Math.random() * 30);
            }
            pos++;
            await sleep(90);
          }

          // Submit and judge.
          const verdict = ATTEMPTS[a].verdict;
          setState((s) => ({ ...s, phase: "submitting", attempt: a, caret: { line: -1, col: 0 } }));
          await sleep(450);
          const stopAt = verdict.failTest ?? TOTAL_TESTS;
          for (let t = 1; t <= stopAt; t++) {
            setState((s) => ({ ...s, phase: "running", test: t }));
            await sleep(verdict.code === "TLE" && t === stopAt ? 1300 : 110);
          }
          setState((s) => ({ ...s, phase: "verdict", verdict }));
          await sleep(verdict.code === "AC" ? 5000 : 2600);
          setState((s) => ({ ...s, phase: "typing", verdict: null, test: 0 }));
        }
      }
    }

    run().catch(() => {
      /* cancelled on unmount */
    });
    return () => {
      cancelled = true;
      io.disconnect();
    };
  }, []);

  const { lines, caret, phase, test, verdict } = state;
  const judging = phase === "running" || phase === "submitting";

  return (
    <div ref={rootRef} className="overflow-hidden rounded-xl border border-border bg-surface shadow-2xl shadow-black/20">
      <p className="sr-only">
        Animation: a solution to a range-sum problem is written and submitted four times. It gets Time Limit Exceeded,
        then Wrong Answer, then Run Time Error, and finally Accepted.
      </p>

      <div aria-hidden="true">
        {/* window bar */}
        <div className="flex items-center gap-2 border-b border-border bg-surface-2 px-4 py-2.5">
          <span className="size-3 rounded-full bg-hard/70" />
          <span className="size-3 rounded-full bg-medium/70" />
          <span className="size-3 rounded-full bg-easy/70" />
          <span className="ml-2 rounded-md bg-surface px-2.5 py-1 font-mono text-xs text-fg">solution.cpp</span>
          <span className="ml-auto font-mono text-[11px] text-muted">attempt {state.attempt + 1}/4</span>
        </div>

        {/* problem statement */}
        <div className="border-b border-border px-4 py-3 text-xs leading-relaxed">
          <p className="font-mono font-semibold text-fg">
            <span className="text-accent">Problem</span> · Range Sums
          </p>
          <p className="mt-1 text-muted">
            Given n integers and q queries (l, r), print a<sub>l</sub> + … + a<sub>r</sub>. n, q ≤ 2·10⁵, |a<sub>i</sub>| ≤ 10⁹.
          </p>
        </div>

        {/* editor */}
        <pre className="overflow-hidden px-2 py-3 font-mono text-[11px] leading-[1.55] sm:text-[12.5px]" style={{ height: `calc(${MAX_LINES} * 1.55em + 1.5rem)` }}>
          {lines.map((line, i) => (
            <div key={i} className="flex">
              <span className="w-7 shrink-0 select-none pr-3 text-right text-muted/50">{i + 1}</span>
              <span className="whitespace-pre text-fg">
                {highlight(caret.line === i ? line.slice(0, caret.col) : line)}
                {caret.line === i && <span className="cursor-blink inline-block h-[1.15em] w-[2px] translate-y-[0.2em] bg-accent" />}
                {caret.line === i && highlight(line.slice(caret.col))}
              </span>
            </div>
          ))}
        </pre>

        {/* submit bar + judge */}
        <div className="flex min-h-[4.75rem] items-center gap-3 border-t border-border bg-surface-2 px-4 py-3">
          <span
            className={`shrink-0 rounded-md px-3 py-1.5 font-mono text-xs font-semibold transition-all ${
              phase === "submitting" ? "scale-95 bg-accent-strong text-on-accent" : judging ? "bg-accent/50 text-on-accent" : "bg-accent text-on-accent"
            }`}
          >
            {judging ? "Judging…" : "Submit"}
          </span>
          <div className="min-w-0 flex-1 font-mono text-xs">
            {phase === "verdict" && verdict ? (
              <div className={`rounded-md border px-3 py-1.5 ${verdictStyle[verdict.code]}`}>
                <p className="font-bold">
                  {verdict.code === "AC" ? "✓ " : ""}
                  {verdict.title}
                </p>
                <p className="truncate text-[11px] text-fg/80">{verdict.detail}</p>
              </div>
            ) : judging ? (
              <div>
                <p className="text-muted">
                  Running on test {Math.max(test, 1)} / {TOTAL_TESTS}…
                </p>
                <div className="mt-1.5 flex gap-[3px]">
                  {Array.from({ length: TOTAL_TESTS }, (_, k) => (
                    <span key={k} className={`h-1.5 flex-1 rounded-full ${k < test - 1 ? "bg-easy" : k === test - 1 ? "animate-pulse bg-medium" : "bg-border"}`} />
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-muted">Writing a solution…</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
