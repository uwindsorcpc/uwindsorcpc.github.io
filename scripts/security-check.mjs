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

// --- attendance and RSVPs (0002_attendance.sql) ---
for (const t of ["attendance", "rsvps", "event_checkins", "checkin_tickets", "checkin_failures", "rate_log"]) {
  await check(`cannot read ${t}`, async () => refused(await db.from(t).select("*").limit(1)));
}
await check("cannot insert attendance directly", async () =>
  refused(await db.from("attendance").insert({ event_id: NO_ID, full_name: "x", email: "x@x.com", display_name: "x" })),
);
for (const fn of ["open_checkin", "close_checkin", "checkin_display"]) {
  await check(`cannot call admin function ${fn}`, async () => refused(await db.rpc(fn, { p_event_id: NO_ID })));
}
await check("can see whether check-in is open", async () => !(await db.rpc("current_checkin")).error);
await check("public board shows screen names only", async () => {
  const { data, error } = await db.rpc("checkin_board");
  return !error && Array.isArray(data.entries) && data.entries.every((e) => Object.keys(e).sort().join() === "guest,name");
});
await check("a made-up ticket can't check anyone in", async () => {
  const { data } = await db.rpc("submit_checkin", {
    p_ticket: crypto.randomUUID(),
    p_full_name: "Security Check",
    p_email: "security-check@gmail.com",
    p_display_name: "",
    p_as_guest: true,
  });
  return data?.status === "bad_ticket";
});
await check("RSVP to a non-existent event is refused", async () => {
  const { data } = await db.rpc("submit_rsvp", { p_event_id: NO_ID, p_full_name: "Security Check", p_email: "security-check@gmail.com", p_as_guest: true });
  return data?.status === "closed";
});
await check("RSVP counts expose numbers only", async () => {
  const { data, error } = await db.rpc("rsvp_counts");
  return !error && Object.values(data ?? {}).every((v) => typeof v === "number");
});

let failed = 0;
for (const [status, name] of results) {
  if (status === "FAIL") failed++;
  console.log(`${status === "PASS" ? "✓" : "✗"} ${name}`);
}
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed ? 1 : 0);
