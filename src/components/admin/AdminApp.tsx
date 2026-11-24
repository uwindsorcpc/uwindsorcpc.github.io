"use client";

import { useCallback, useEffect, useState } from "react";

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

const IDLE_LIMIT_MS = 30 * 60 * 1000;

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

  const email = session.user.email ?? "";
  const { data: adminRow } = await db.from("admins").select("user_id").eq("user_id", session.user.id).maybeSingle();
  if (!adminRow) return { kind: "notAdmin", email };

  const { data: aal } = await db.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel !== "aal2") return { kind: aal?.nextLevel === "aal2" ? "verify" : "enroll" };
  return { kind: "ready", email };
}

export function AdminApp() {
  const [stage, setStage] = useState<Stage>({ kind: "loading" });

  const refresh = useCallback(() => {
    resolveStage()
      .then(setStage)
      .catch(() => setStage({ kind: "signedOut" }));
  }, []);

  const signOut = useCallback(() => {
    getAdminDb()
      .auth.signOut()
      .finally(() => setStage({ kind: "signedOut" }));
  }, []);

  useEffect(() => {
    refresh();
    const { data } = getAdminDb().auth.onAuthStateChange(() => {
      // Supabase advises not calling it again inside this callback directly.
      setTimeout(refresh, 0);
    });
    return () => data.subscription.unsubscribe();
  }, [refresh]);

  // Sign out automatically after 30 minutes without activity.
  useEffect(() => {
    if (stage.kind !== "ready") return;
    let last = Date.now();
    const bump = () => {
      last = Date.now();
    };
    const events = ["pointerdown", "keydown", "scroll"] as const;
    events.forEach((e) => window.addEventListener(e, bump, { passive: true }));
    const timer = setInterval(() => {
      if (Date.now() - last > IDLE_LIMIT_MS) signOut();
    }, 60_000);
    return () => {
      events.forEach((e) => window.removeEventListener(e, bump));
      clearInterval(timer);
    };
  }, [stage.kind, signOut]);

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
      return <NotAdmin email={stage.email} onSignOut={signOut} />;
    case "enroll":
      return <MfaEnroll onSignOut={signOut} />;
    case "verify":
      return <MfaVerify onSignOut={signOut} />;
    case "ready":
      return <Dashboard email={stage.email} onSignOut={signOut} />;
  }
}
