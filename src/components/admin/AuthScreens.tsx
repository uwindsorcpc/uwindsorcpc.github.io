"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";

import { clearSessionPolicy, REMEMBER_DAYS, startSessionPolicy } from "@/lib/supabase/adminSession";
import { getAdminDb } from "@/lib/supabase/clients";
import { Logo } from "../Logo";
import { inputClass, labelClass, primaryBtn, secondaryBtn } from "./styles";

export function AuthCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 shadow-2xl shadow-black/20">
        <Logo />
        <h1 className="mt-6 text-2xl font-bold">{title}</h1>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

function ErrorText({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="text-sm text-hard">
      {children}
    </p>
  );
}

/** Step 1: email + password. */
export function LoginForm() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    // Set before signing in: the page checks it as soon as the session appears.
    startSessionPolicy(f.get("remember") === "on");
    const { error } = await getAdminDb().auth.signInWithPassword({
      email: String(f.get("email") ?? "").trim(),
      password: String(f.get("password") ?? ""),
    });
    setBusy(false);
    // Same message for every failure, so the form doesn't reveal which emails exist.
    if (error) {
      clearSessionPolicy();
      setError("Sign-in failed. Check your email and password.");
    }
  }

  return (
    <AuthCard title="Admin sign-in">
      <form onSubmit={onSubmit} className="grid gap-4">
        <div>
          <label htmlFor="email" className={labelClass}>
            Email
          </label>
          <input id="email" name="email" type="email" required autoComplete="username" className={inputClass} />
        </div>
        <div>
          <label htmlFor="password" className={labelClass}>
            Password
          </label>
          <input id="password" name="password" type="password" required autoComplete="current-password" className={inputClass} />
        </div>
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" name="remember" className="mt-0.5 size-4 shrink-0 accent-[var(--accent)]" />
          <span>
            Keep me signed in on this device for {REMEMBER_DAYS} days
            <span className="block text-xs text-muted">Only on your own computer or phone, never a shared or lab one.</span>
          </span>
        </label>
        {error && <ErrorText>{error}</ErrorText>}
        <button type="submit" disabled={busy} className={primaryBtn}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </AuthCard>
  );
}

function CodeForm({ onCode, busyLabel, error }: { onCode: (code: string) => Promise<void>; busyLabel: string; error: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        await onCode(String(new FormData(e.currentTarget).get("code") ?? "").replace(/\s/g, ""));
        setBusy(false);
      }}
      className="grid gap-4"
    >
      <div>
        <label htmlFor="code" className={labelClass}>
          6-digit code from your authenticator app
        </label>
        <input
          id="code"
          name="code"
          required
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9 ]{6,7}"
          maxLength={7}
          autoFocus
          className={`${inputClass} font-mono text-lg tracking-[0.3em]`}
        />
      </div>
      {error && <ErrorText>{error}</ErrorText>}
      <button type="submit" disabled={busy} className={primaryBtn}>
        {busy ? busyLabel : "Verify"}
      </button>
    </form>
  );
}

/** Step 2a (first sign-in only): set up an authenticator app. */
export function MfaEnroll({ onSignOut }: { onSignOut: () => void }) {
  const [enrollment, setEnrollment] = useState<{ id: string; qr: string; secret: string } | null>(null);
  const [error, setError] = useState("");
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    (async () => {
      const db = getAdminDb();
      // Clear any half-finished setup from an earlier visit.
      const { data: factors } = await db.auth.mfa.listFactors();
      for (const f of factors?.all ?? []) {
        if (f.status === "unverified") await db.auth.mfa.unenroll({ factorId: f.id });
      }
      const { data, error } = await db.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: `CPC admin ${new Date().toISOString().slice(0, 10)}`,
        issuer: "CPC UWindsor",
      });
      if (error || !data) {
        setError("Couldn't start 2FA setup. Reload the page to try again.");
        return;
      }
      setEnrollment({ id: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
    })();
  }, []);

  return (
    <AuthCard title="Set up two-factor sign-in">
      <p className="text-sm text-muted">
        Admin access needs a second step. Scan this QR code with an authenticator app (Google Authenticator, Authy,
        1Password…), then enter the 6-digit code it shows.
      </p>
      {enrollment ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- QR code is a data URL generated by Supabase */}
          <img src={enrollment.qr} alt="QR code for your authenticator app" className="mx-auto my-6 size-48 rounded-lg bg-white p-2" />
          <details className="mb-6 text-sm text-muted">
            <summary className="cursor-pointer">Can&apos;t scan? Enter this key instead</summary>
            <code className="mt-2 block break-all rounded-md bg-surface-2 p-3 font-mono text-xs text-fg">{enrollment.secret}</code>
          </details>
          <CodeForm
            busyLabel="Verifying…"
            error={error}
            onCode={async (code) => {
              setError("");
              const { error } = await getAdminDb().auth.mfa.challengeAndVerify({ factorId: enrollment.id, code });
              if (error) setError("That code didn't work. Wait for a new code and try again.");
            }}
          />
        </>
      ) : (
        <p className="my-6 font-mono text-sm text-muted">{error || "Preparing…"}</p>
      )}
      <button type="button" onClick={onSignOut} className={`${secondaryBtn} mt-4 w-full`}>
        Cancel and sign out
      </button>
    </AuthCard>
  );
}

/** Step 2b (every sign-in): enter the current authenticator code. */
export function MfaVerify({ onSignOut }: { onSignOut: () => void }) {
  const [error, setError] = useState("");
  return (
    <AuthCard title="Two-factor sign-in">
      <CodeForm
        busyLabel="Verifying…"
        error={error}
        onCode={async (code) => {
          setError("");
          const db = getAdminDb();
          const { data } = await db.auth.mfa.listFactors();
          const factor = data?.totp?.[0];
          if (!factor) {
            setError("No authenticator is set up for this account.");
            return;
          }
          const { error } = await db.auth.mfa.challengeAndVerify({ factorId: factor.id, code });
          if (error) setError("That code didn't work. Wait for a new code and try again.");
        }}
      />
      <button type="button" onClick={onSignOut} className={`${secondaryBtn} mt-4 w-full`}>
        Sign out
      </button>
    </AuthCard>
  );
}

export function NotAdmin({ email, onSignOut }: { email: string; onSignOut: () => void }) {
  return (
    <AuthCard title="No admin access">
      <p className="text-sm text-muted">
        You&apos;re signed in as <span className="font-mono text-fg">{email}</span>, but this account isn&apos;t an admin.
        Ask an existing admin to add you.
      </p>
      <button type="button" onClick={onSignOut} className={`${primaryBtn} mt-6 w-full`}>
        Sign out
      </button>
    </AuthCard>
  );
}
