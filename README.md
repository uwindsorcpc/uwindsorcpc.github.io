# CPC UWindsor website

The website for **CPC UWindsor**, the UWindsor Competitive Programming Club, live at **https://uwindsorcpc.github.io**.

- **Frontend:** Next.js (App Router), TypeScript and Tailwind CSS, built into static files and hosted free on GitHub Pages.
- **Database:** [Supabase](https://supabase.com) (PostgreSQL, Canada Central region, free plan) stores events, the team, contests, problems, the FAQ, member sign-ups, event check-ins and RSVPs.
- **Admin:** a private page at **`/admin`** with email + password + 2FA, where execs edit everything in the database. No coding needed.

No analytics, no tracking, no paid services.

> **Sample content:** the database and `/content` start with placeholder data (`[Exec Name 1]`, `[CLUB_EMAIL]`, fake events…). A yellow "PREVIEW" banner shows on every page until you turn it off. See [Before launch](#before-launch).

---

## Quick start (developers)

You need [Node.js](https://nodejs.org/) 20.9 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:3000. Pages reload automatically when you save a file. The dev site uses the real database, so edits made in `/admin` locally are real edits.

| Command                  | What it does                                                         |
| ------------------------ | -------------------------------------------------------------------- |
| `npm run dev`            | Run the site locally while you edit                                  |
| `npm run build`          | Build the production site into `/out` (reads the database)           |
| `npm run lint`           | Check the code for common problems                                   |
| `npm run security-check` | Try to break into the database as an outsider (45 checks); every attempt must fail |

---

## Where content lives

| What                                                           | Where to edit it                    |
| -------------------------------------------------------------- | ----------------------------------- |
| Events, team, past contests, practice problems, FAQ            | **`/admin`** (stored in Supabase)   |
| Member sign-ups from the Join page                             | **`/admin` → Members** (private)    |
| Event check-ins and RSVPs                                      | **`/admin` → Attendance / RSVPs** (private) |
| Club name, email, Discord, social links, home page text        | `content/site.json`                 |
| The About page                                                 | `content/about.md` (Markdown)       |
| Beginner roadmap, practice platforms, books                    | `content/resources.json`            |
| C++ and Python starter templates                               | `content/templates/*`               |

Admin edits show up on the site **immediately**: pages load the latest data from the database in the visitor's browser. File edits need a push to GitHub, and the site redeploys within about 2 minutes. You can edit files right on GitHub: open the file → pencil icon → **Commit changes**.

---

## Using the admin page

Go to **https://uwindsorcpc.github.io/admin**. It isn't linked anywhere on the site, and search engines are told not to index it.

**First sign-in**
1. Sign in with your email and password.
2. Scan the QR code with an authenticator app (Google Authenticator, Authy, 1Password…) and enter the 6-digit code.
3. On every later sign-in you'll be asked for a fresh code. You're signed out after 30 minutes without activity.

**Sections:** Events · Members · Attendance · RSVPs · Team · Past contests · Problems · FAQ. Each one lets you add, edit and delete rows (Members, Attendance and RSVPs are only created from the public site).
- **Published** controls whether a row appears on the public site. Untick it to keep a draft.
- **Order** sorts team members, problems and FAQ entries (lower numbers come first).
- **Event times** are Windsor time. The site handles daylight saving and visitors in other time zones, and events move from "Upcoming" to "Past" on their own.
- **Team photos** upload straight from the form (JPG/PNG/WebP, under 2 MB).
- **Members** can be searched and exported to CSV. They can't be added from the admin page, only through the Join form. To handle a deletion request, find the person and click **Delete**.

### Running check-in at an event

1. In **`/admin` → Events**, click **Check-in screen ↗** on the event. Put that window on the projector (there's a **Full screen** button).
2. Click **Open check-in**. A QR code and a 5-character code appear; both change every 30 seconds, so a photo or a shared link stops working quickly. Check-in closes on its own 30 minutes after the event ends (or 3 hours after opening, whichever is later), or click **Close check-in**.
3. People **scan the QR** (no typing), or go to **uwindsorcpc.github.io/attend** and type the code. They enter their name, email, and what to show on screen (blank = a fun anonymous name like *Segment Tree #7*).
   - **Members** (email is in the member list) are checked in straight away.
   - **Non-members** see *RuntimeError: you're not a registered member* and can **sign up** (name and email carried over) or **continue as a guest**. Guests can't use throwaway email services, nonsense names, or links in their screen name, and are marked "guest".
4. The board on the screen shows **screen names only**. Tick **Show names & emails (don't project!)** to see real details and **Hide** or **Remove** an entry.
5. Afterwards, **Attendance** has everyone with real names and emails (search, CSV export).

**RSVPs:** upcoming events on `/events` and `/attend` have an **RSVP** button (same member/guest flow, plus *Add to calendar*). Counts show as "12 going"; the names are in **`/admin` → RSVPs**.

### Adding another admin
1. In Supabase: **Authentication → Users → Add user → Create new user**. Enter their email and a temporary password, and tick **Auto Confirm User**. Share the password with them privately; they should change it later.
2. In Supabase: **SQL Editor → New query**, replace the email, and run:
   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'their.email@example.com';
   ```
3. They sign in at `/admin` and set up their own 2FA.

**Removing an admin:** run `delete from public.admins where user_id = (select id from auth.users where email = '…');`, then delete the user under **Authentication → Users**.

**Lost phone / authenticator:** another admin deletes that person's MFA factor in Supabase (**Authentication → Users →** the user **→** MFA factors). Their next sign-in asks them to set up 2FA again.

---

## How the data is protected

Hiding the `/admin` URL is not the protection; the repo is public. The protection is in the database:

- **Row Level Security is on for every table.** Rules inside PostgreSQL decide who can do what, no matter how the database is reached.
  - **Public content:** anyone can read rows marked *published*. Only admins can add, change or delete anything.
  - **Members, attendance and RSVPs:** only admins can read, change, count or delete them. The public can't even read back their own entry.
- **Admin = listed in `public.admins` AND signed in with 2FA.** The database itself checks the 2FA level (`aal2`), so a stolen password alone can't change or read anything.
- **No public accounts.** Sign-up is turned off in Supabase; admins are created by hand.
- **The Join form can only call `submit_signup()`.** It validates the input, ignores duplicate emails without revealing them, and limits floods of sign-ups.
- **Check-in** needs the rotating room code (proof you're in the room). The code is traded for a private 15-minute ticket that checks in exactly one person and allows only a few tries, so it can't be used to test which emails are members. Failed codes, guest check-ins and RSVP lookups are rate-limited. Check-in secrets and tickets can't be read through the API at all.
- **The public board** gets only the screen names people chose, never real names or emails.
- **Only the publishable key is in the code** (`src/lib/supabase/config.ts`). It's public by design and can do nothing the rules don't allow.
- **Automatic check:** `npm run security-check` runs before every deploy. It acts as an outsider and makes 45 checks (reading private tables, writing anything, calling admin functions…). If any forbidden action succeeds, the deploy is blocked.
- Admin-entered links are only shown if they start with `https://` (or are emails), and the CSV export defuses spreadsheet formulas.

### Rules for whoever maintains this

1. **Never** put the Supabase **secret / service_role key** or the **database password** in this repo, a GitHub secret, chat, or a screenshot.
2. Any new table needs Row Level Security **and** explicit rules. Add it as a new numbered file in `supabase/migrations/` (e.g. `0003_….sql`), copying the pattern in the existing files, which stop with an error if any table is left without RLS.
3. Keep 2FA on for every admin, and on the GitHub and Supabase accounts that own the project.
4. Collect only what the club needs. Never collect student numbers.

### Database files

| File                                  | What it is                                                                  |
| ------------------------------------- | --------------------------------------------------------------------------- |
| `supabase/migrations/0001_schema.sql` | Tables, security rules, sign-up function, photo storage. Safe to re-run.    |
| `supabase/migrations/0002_attendance.sql` | Check-in, attendance, RSVPs, the public board. Safe to re-run.         |
| `supabase/seed.sql`                   | The sample content. Run once on a fresh database (running it twice duplicates rows). |

To set up a fresh Supabase project: create it in **Canada (Central)**, turn off public sign-ups (**Authentication → Sign In / Providers**), run `0001_schema.sql`, then `seed.sql`, then `0002_attendance.sql` in the SQL Editor, then add an admin as above. Put the new Project URL and publishable key in `src/lib/supabase/config.ts`.

**Free-plan notes:** Supabase pauses free projects after a week without activity. The daily rebuild (below) reads the database, which keeps it awake. The free plan has no automatic backups, so export important data (for example **Members → Export CSV**) now and then and store it somewhere private, never in this repo.

---

## Before launch

1. In `content/site.json`, replace every value in `[SQUARE_BRACKETS]`:
   - `email`: `[CLUB_EMAIL]`
   - `discordUrl`: `[DISCORD_URL]` (it appears in two places: the field and the Discord social link)
   - each URL in `socials` (delete any platform the club doesn't use)
2. In `/admin`, replace the sample events, team members, past contests, problems and FAQ, and delete any test entries under **Members**, **Attendance** and **RSVPs**.
3. Rewrite `content/about.md` in the club's own words.
4. Set `"showSampleContentBanner": false` in `content/site.json`.

Until a link is filled in, the site shows a greyed-out **"link coming soon"** button instead of a broken link.

---

## Deploying (GitHub Pages)

The site is published from the `uwindsorcpc/uwindsorcpc.github.io` repository by `.github/workflows/deploy.yml`. It runs:

- on every push to `main`,
- **once a day**, so the built pages stay fresh and Supabase never pauses,
- or by hand: **Actions → Deploy to GitHub Pages → Run workflow**.

Each run installs packages, lints, runs the **security check**, builds the site (reading the database), and publishes it. If any step fails, nothing is published and the live site stays as it was; the **Actions** tab shows the error.

Setup facts, already done: the repo must be **public** and named exactly `uwindsorcpc.github.io`, and **Settings → Pages → Source** must be **GitHub Actions**. For a custom domain, use **Settings → Pages → Custom domain**, then update `url` in `content/site.json` and the Site URL in Supabase (**Authentication → URL Configuration**).

---

## Changing the look

- **Colours:** every colour is a CSS variable at the top of `src/app/globals.css`, with one block for dark mode (the default) and one for light mode. If you change `--bg` or `--accent`, also update the hex values in `src/app/icon.svg`, `src/app/og.png/route.tsx` (social preview image) and `src/app/apple-touch-icon.png/route.tsx` (iPhone icon).
- **Logo:** the wordmark is text, built in `src/components/Logo.tsx`. The square favicon is `src/app/icon.svg`.
- **Fonts:** Geist (text) and JetBrains Mono (code accents), set in `src/app/layout.tsx`. They're downloaded at build time and served from the site itself.

## Project structure

```
content/                  ← file-based content (settings, About, roadmap, templates)
supabase/                 ← database schema, security rules, sample data
scripts/security-check.mjs← the outsider test run before every deploy
src/app/(site)/           ← public pages (home, about, events, attend, contests, resources, team, join)
src/app/admin/            ← the /admin page and the check-in screen (admin/present)
src/components/attend/    ← check-in form, RSVP pop-up, public board, check-in banner
src/components/admin/     ← sign-in, 2FA, and the editors for each table
src/lib/db/               ← reads public data from Supabase (build time and in the browser)
src/lib/supabase/         ← Supabase URL, publishable key, clients
.github/workflows/        ← build, security check and deploy
```

## Roadmap ideas

- **Attendance stats:** turnout per event, most active members, streaks for people who opt in.
- **Leaderboard:** use the optional Codeforces handles from sign-ups to show member ratings.

## Accessibility and privacy

- Semantic HTML, a skip link, visible keyboard focus, and labelled icons and buttons. Colour contrast meets WCAG AA in both themes, and animations are off for visitors who prefer reduced motion.
- No analytics or tracking cookies. The browser stores only the light/dark choice and, for admins, their sign-in session.
- Sign-up data is stored in Supabase's Canada (Central) region and is visible only to admins. People can ask for their data to be deleted at any time.
