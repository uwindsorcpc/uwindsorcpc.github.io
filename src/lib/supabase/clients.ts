import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./config";

/**
 * Client for public pages and for the build. It never stores a login, so a
 * signed-in admin browsing the public site still gets exactly what visitors see.
 */
export const publicDb: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: "cpc-public" },
});

let adminDb: SupabaseClient | undefined;

/** Client for the /admin page: keeps the admin's session in this browser. */
export function getAdminDb(): SupabaseClient {
  adminDb ??= createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: "cpc-admin" },
  });
  return adminDb;
}
