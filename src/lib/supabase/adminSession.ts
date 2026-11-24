/**
 * How long an admin stays signed in on this browser.
 *
 *   "Keep me signed in" ticked → 7 days, no idle timeout.
 *   Not ticked                 → at most 12 hours, and signed out after
 *                                30 minutes with no activity in ANY admin tab
 *                                (an open check-in screen counts as activity).
 *
 * This is enforced by the admin page. The database still requires 2FA for
 * every admin action, and "Sign out everywhere" ends all sessions at once.
 */
const POLICY_KEY = "cpc-admin-policy";
const ACTIVE_KEY = "cpc-admin-active";

export const REMEMBER_DAYS = 7;
const REMEMBER_MS = REMEMBER_DAYS * 24 * 60 * 60 * 1000;
const SHORT_MS = 12 * 60 * 60 * 1000;
export const IDLE_LIMIT_MS = 30 * 60 * 1000;

export type SessionPolicy = { remember: boolean; until: number };

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage blocked: the session simply won't be remembered */
  }
}

/** Call right before signing in. */
export function startSessionPolicy(remember: boolean) {
  write(POLICY_KEY, { remember, until: Date.now() + (remember ? REMEMBER_MS : SHORT_MS) } satisfies SessionPolicy);
  markActive();
}

export function readSessionPolicy(): SessionPolicy | null {
  return read<SessionPolicy>(POLICY_KEY);
}

export function clearSessionPolicy() {
  try {
    localStorage.removeItem(POLICY_KEY);
    localStorage.removeItem(ACTIVE_KEY);
  } catch {
    /* ignore */
  }
}

/** Shared across tabs, so one busy admin tab keeps the others signed in. */
export function markActive() {
  write(ACTIVE_KEY, Date.now());
}

export function sessionExpired(policy = readSessionPolicy()): boolean {
  if (!policy || Date.now() > policy.until) return true;
  if (policy.remember) return false;
  const last = read<number>(ACTIVE_KEY) ?? 0;
  return Date.now() - last > IDLE_LIMIT_MS;
}
