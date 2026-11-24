// Acts as an anonymous visitor holding only the public (publishable) key and
// checks that the database refuses everything it should.
//
//   npm run security-check
//
// Runs on every push in GitHub Actions; a failure blocks the deploy.
// It never creates, changes or deletes real data.
import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://ihfjvchsxioolpakusol.supabase.co";
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_0GmTLIuCf7KEMkGOWATbKg_TwtehRcI";

const db = createClient(URL, KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const CONTENT = ["events", "team_members", "past_contests", "problems", "faqs"];
const NO_ID = "00000000-0000-0000-0000-000000000000";

const results = [];
async function check(name, run) {
  try {
    const ok = await run();
    results.push([ok ? "PASS" : "FAIL", name]);
  } catch (e) {
    results.push(["FAIL", `${name} (threw: ${e.message})`]);
  }
}
const refused = (res) => Boolean(res.error);

// --- what visitors SHOULD be able to do ---
for (const t of CONTENT) {
  await check(`can read published ${t}`, async () => !(await db.from(t).select("id").limit(1)).error);
}
await check("drafts are hidden from visitors", async () => {
  const { data, error } = await db.from("events").select("id, published").eq("published", false);
  return !error && data.length === 0;
});

// --- what visitors must NOT be able to do ---
await check("cannot read members", async () => refused(await db.from("members").select("*").limit(1)));
await check("cannot count members", async () => refused(await db.from("members").select("*", { count: "exact", head: true })));
await check("cannot insert members directly", async () =>
  refused(await db.from("members").insert({ full_name: "x", email: "x@example.com", consented_at: new Date().toISOString() })),
);
await check("cannot read the admins list", async () => refused(await db.from("admins").select("*").limit(1)));
await check("cannot make themselves an admin", async () => refused(await db.from("admins").insert({ user_id: NO_ID })));

for (const t of CONTENT) {
  await check(`cannot insert into ${t}`, async () => refused(await db.from(t).insert({})));
  await check(`cannot update ${t}`, async () => refused(await db.from(t).update({ published: false }).neq("id", NO_ID)));
  await check(`cannot delete from ${t}`, async () => refused(await db.from(t).delete().neq("id", NO_ID)));
}

await check("private helper functions are not exposed", async () => refused(await db.rpc("is_admin")));
await check("sign-up function rejects missing consent", async () => {
  const res = await db.rpc("submit_signup", {
    p_full_name: "Security check",
    p_email: "security-check@example.invalid",
    p_program: "",
    p_year_of_study: "",
    p_experience: "none",
    p_codeforces_handle: "",
    p_consent: false,
  });
  return res.error?.code === "22023";
});
await check("cannot upload to team-photos", async () =>
  refused(await db.storage.from("team-photos").upload(`security-check-${Date.now()}.txt`, new Blob(["x"]), { contentType: "image/png" })),
);
await check("public account sign-up is disabled", async () => {
  const res = await db.auth.signUp({ email: `security-check-${Date.now()}@example.invalid`, password: crypto.randomUUID() });
  return Boolean(res.error);
});

let failed = 0;
for (const [status, name] of results) {
  if (status === "FAIL") failed++;
  console.log(`${status === "PASS" ? "✓" : "✗"} ${name}`);
}
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed ? 1 : 0);
