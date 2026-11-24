/**
 * Supabase project settings.
 *
 * Both values are PUBLIC BY DESIGN: they end up in every visitor's browser.
 * The publishable key can only do what the database's Row Level Security
 * rules allow (see supabase/migrations). Never put the secret / service_role
 * key or the database password in this repo.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://ihfjvchsxioolpakusol.supabase.co";

export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_0GmTLIuCf7KEMkGOWATbKg_TwtehRcI";
