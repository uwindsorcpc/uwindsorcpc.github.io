"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";

import {
  clearSessionPolicy,
  markActive,
  readSessionPolicy,
  sessionExpired,
  type SessionPolicy,
} from "@/lib/supabase/adminSession";
import { getAdminDb } from "@/lib/supabase/clients";
import { AuthCard, LoginForm, MfaEnroll, MfaVerify, NotAdmin } from "./AuthScreens";
import { Dashboard } from "./Dashboard";

type Stage =
  | { kind: "loading" }
  | { kind: "signedOut" }
  | { kind: "notAdmin"; email: string }
  | { kind: "enroll" }
  | { kind: "verify" }
  | { kind: "ready"; email: string };

/**
 * Works out which screen to show. This only decides the UI: the database
 * itself refuses every admin action unless the user is a listed admin AND
 * passed 2FA, whatever this page shows.
 */
async function resolveStage(): Promise<Stage> {
  const db = getAdminDb();
  const { data } = await db.auth.getSession();
  const session = data.session;
  if (!session) return { kind: "signedOut" };

  // Past the 7-day / 12-hour limit, or idle too long: sign out this browser.
  if (sessionExpired()) {
    await db.auth.signOut({ scope: "local" });
    clearSessionPolicy();
    return { kind: "signedOut" };
  }

  const email = session.user.email ?? "";
  const { data: adminRow } = await db.from("admins").select("user_id").eq("user_id", session.user.id).maybeSingle();
  if (!adminRow) return { kind: "notAdmin", email };

  const { data: aal } = await db.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel !== "aal2") return { kind: aal?.nextLevel === "aal2" ? "verify" : "enroll" };
  return { kind: "ready", email };
}

export type AdminContext = {
  email: string;
  policy: SessionPolicy | null;
  /** Signs out this browser only. */
  signOut: () => void;
  /** Ends every session for this account, on every device. */
  signOutEverywhere: () => void;
};

/** The /admin page. */
export function AdminApp() {
  return <AdminGate>{(ctx) => <Dashboard ctx={ctx} />}</AdminGate>;
}

/**
 * Shows sign-in, 2FA, or "not an admin" until the user is a fully verified
 * admin, then renders its children. Used by /admin and the presenter screen.
 */
export function AdminGate({
  children,
  keepAlive = false,
}: {
  children: (ctx: AdminContext) => ReactNode;
  /** For screens nobody touches (the projector): count them as active. */
  keepAlive?: boolean;
}) {
  const [stage, setStage] = useState<Stage>({ kind: "loading" });

  const refresh = useCallback(() => {
    resolveStage()
      .then(setStage)
      .catch(() => setStage({ kind: "signedOut" }));
  }, []);

  // "local" = this browser only. (Supabase's default would end the
  // session on every device, e.g. the projector, whenever one tab idles out.)
  const signOut = useCallback((scope: "local" | "global" = "local") => {
    getAdminDb()
      .auth.signOut({ scope })
      .finally(() => {
        clearSessionPolicy();
        setStage({ kind: "signedOut" });
      });
  }, []);

  useEffect(() => {
    refresh();
    const { data } = getAdminDb().auth.onAuthStateChange(() => {
      // Supabase advises not calling it again inside this callback directly.
      setTimeout(refresh, 0);
    });
    return () => data.subscription.unsubscribe();
  }, [refresh]);

  // Track activity (shared across admin tabs) and enforce the session limits.
  useEffect(() => {
    if (stage.kind !== "ready") return;
    let lastMark = 0;
    const bump = () => {
      if (Date.now() - lastMark > 30_000) {
        lastMark = Date.now();
        markActive();
      }
    };
    bump();
    const events = ["pointerdown", "keydown", "scroll"] as const;
    events.forEach((e) => window.addEventListener(e, bump, { passive: true }));
    const timer = setInterval(() => {
      if (keepAlive) markActive();
      if (sessionExpired()) signOut();
    }, 60_000);
    return () => {
      events.forEach((e) => window.removeEventListener(e, bump));
      clearInterval(timer);
    };
  }, [stage.kind, keepAlive, signOut]);

  switch (stage.kind) {
    case "loading":
      return (
        <AuthCard title="Admin">
          <p className="font-mono text-sm text-muted">Checking your session…</p>
        </AuthCard>
      );
    case "signedOut":
      return <LoginForm />;
    case "notAdmin":
      return <NotAdmin email={stage.email} onSignOut={() => signOut()} />;
    case "enroll":
      return <MfaEnroll onSignOut={() => signOut()} />;
    case "verify":
      return <MfaVerify onSignOut={() => signOut()} />;
    case "ready":
      return children({
        email: stage.email,
        policy: readSessionPolicy(),
        signOut: () => signOut("local"),
        signOutEverywhere: () => signOut("global"),
      });
  }
}
