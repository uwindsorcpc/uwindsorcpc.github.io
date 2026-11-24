# CPC UWindsor website

The website for **CPC UWindsor**, the UWindsor Competitive Programming Club.

Built with Next.js (App Router), TypeScript and Tailwind CSS. The whole site is **static**: there is no backend, no database, no analytics and no paid services. `npm run build` produces plain HTML files that Vercel serves for free.

> **Sample content:** everything in `/content` is placeholder data (fake events, `[Exec Name 1]`, `[CLUB_EMAIL]` and so on). A yellow "PREVIEW" banner shows at the top of every page until you turn it off. See [Before launch](#before-launch).

---

## Quick start

You need [Node.js](https://nodejs.org/) 20.9 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:3000. Pages reload automatically when you save a file.

| Command         | What it does                                                    |
| --------------- | --------------------------------------------------------------- |
| `npm run dev`   | Run the site locally while you edit                             |
| `npm run build` | Build the production site into `/out` (also catches mistakes)   |
| `npm run lint`  | Check the code for common problems                              |

---

## Editing content (no coding needed)

All text and data live in the **`/content`** folder. You never need to touch the code in `/src` to update the site.

| File                        | What it controls                                                          |
| --------------------------- | ------------------------------------------------------------------------- |
| `content/site.json`         | Club name, email, Google Form, Discord, social links, home page text      |
| `content/events.json`       | Events on the Events page and the home page countdown                     |
| `content/team.json`         | Exec cards on the Team page                                               |
| `content/contests.json`     | Past club contests and practice problem lists (easy / medium / hard)      |
| `content/resources.json`    | Beginner roadmap, practice platforms, books                               |
| `content/faq.json`          | FAQ on the Join page                                                      |
| `content/about.md`          | The About page (plain Markdown)                                           |
| `content/templates/*`       | The C++ and Python starter templates on the Resources page               |

**JSON tips** (most mistakes are one of these):

- Text goes inside `"double quotes"`.
- Items in a list are separated by commas, but there is **no comma after the last item**.
- If something breaks, run `npm run build`: it prints the file and the event name that has the problem.
- You can also paste a file into [jsonlint.com](https://jsonlint.com) to find a missing comma or quote.

You can edit files right on GitHub (open the file → pencil icon → **Commit changes**). Vercel redeploys automatically within about a minute.

### Add or change an event

Open `content/events.json` and add an object to the `events` list:

```json
{
  "id": "practice-2027-02-04",
  "title": "Weekly Practice: Prefix Sums",
  "date": "2027-02-04",
  "startTime": "18:00",
  "endTime": "20:00",
  "room": "Erie Hall 3123",
  "type": "practice",
  "description": "Range sums in O(1) after O(n) setup.",
  "kattisUrl": "https://open.kattis.com/problems/..."
}
```

| Field         | Rules                                                                                     |
| ------------- | ----------------------------------------------------------------------------------------- |
| `id`          | Any unique text. `type-date` works well.                                                  |
| `date`        | `YYYY-MM-DD`                                                                              |
| `startTime`, `endTime` | 24-hour `HH:MM` in **Windsor time**. The site handles daylight saving and visitors in other time zones. |
| `type`        | Exactly one of `practice`, `contest`, `workshop`                                          |
| `description` | Optional                                                                                  |
| `kattisUrl`   | Optional. Delete the whole line if there's no link.                                       |

Order doesn't matter: events are sorted by date automatically. You don't need to move old events anywhere either. Each visitor's browser decides what's **upcoming** and what's **past**, so an event moves to "Past events" as soon as it ends, without a redeploy. The home page countdown always targets the next event that hasn't ended.

### Add or change a team member

Open `content/team.json` and edit the `members` list:

```json
{
  "name": "Jane Doe",
  "role": "VP Outreach",
  "bio": "One or two sentences.",
  "photo": "/team/jane.jpg",
  "links": {
    "github": "https://github.com/janedoe",
    "linkedin": "https://www.linkedin.com/in/janedoe",
    "codeforces": "https://codeforces.com/profile/janedoe",
    "kattis": "https://open.kattis.com/users/janedoe",
    "website": "https://janedoe.dev",
    "email": "jane@example.com"
  }
}
```

- **Photo:** put a square image (at least 160×160 px) in `public/team/` and set `"photo": "/team/filename.jpg"`. Leave it as `""` to show the person's initials instead.
- **Links:** all optional. Delete any line you don't need. Supported keys: `github`, `linkedin`, `codeforces`, `kattis`, `website`, `email`.
- Cards appear in the same order as the list.

### Other common edits

- **Contests:** add finished contests to `pastContests` in `content/contests.json`. Add practice problems to `problemSets.easy`, `.medium` or `.hard`.
- **FAQ:** edit `content/faq.json`. Each entry is `{ "q": "...", "a": "..." }`.
- **About page:** edit `content/about.md`. Use `##` for headings, blank lines between paragraphs, and `-` for bullet points.

---

## Before launch

1. In `content/site.json`, replace every value in `[SQUARE_BRACKETS]`:
   - `email`: `[CLUB_EMAIL]`
   - `googleFormUrl`: `[GOOGLE_FORM_URL]`
   - `discordUrl`: `[DISCORD_URL]` (it appears in two places: the field and the Discord social link)
   - each URL in `socials` (delete any platform the club doesn't use)
2. Set `url` in `content/site.json` to the real address, for example `https://cpc-uwindsor.vercel.app`. Search engines and link previews use it.
3. Replace the sample events, team, past contests and About text.
4. Set `"showSampleContentBanner": false` in `content/site.json`.

Until a link is filled in, the site shows a greyed-out **"link coming soon"** button instead of a broken link, so it's safe to deploy early.

---

## Deploying to Vercel (free)

The site is designed for Vercel's free **Hobby** plan. Keep it non-commercial, as the Hobby plan requires: no ads, no payments, no sponsor ad placements.

**First-time setup** (about 5 minutes):

1. Push this folder to a GitHub repository. A club GitHub organization makes it easy to hand the site down to future execs.
2. Sign in at [vercel.com](https://vercel.com) with GitHub, then click **Add New… → Project**.
3. Import the repository. Vercel detects Next.js automatically, so leave every setting at its default.
4. Click **Deploy**. You'll get a URL like `https://cpc-uwindsor.vercel.app`.
5. Put that URL in `content/site.json` → `url` and push the change.

**After that:** every push to the `main` branch redeploys the site automatically. Pull requests get their own preview URLs, so you can check a change before merging it.

**Custom domain (optional):** Vercel → Project → **Settings → Domains**.

> The site has no server code and no environment variables or secrets. `next.config.ts` uses `output: "export"`, so the build fails loudly if anyone adds something that needs a server.

---

## Changing the look

- **Colours:** every colour is a CSS variable at the top of `src/app/globals.css`, with one block for dark mode (the default) and one for light mode. Change them there and the whole site follows. If you change `--bg` or `--accent`, also update the hex values in `src/app/icon.svg`, `src/app/opengraph-image.tsx` and `src/app/apple-icon.tsx`.
- **Logo:** the wordmark is text, built in `src/components/Logo.tsx`. The square favicon is `src/app/icon.svg`.
- **Fonts:** Geist (text) and JetBrains Mono (code accents), set in `src/app/layout.tsx`. They're downloaded at build time and served from the site itself, so visitors never contact Google.

## Project structure

```
content/              ← everything editable (see above)
public/               ← static files such as team photos (public/team/)
src/app/              ← one folder per page (about/, events/, …), layout, favicon, social image
src/components/       ← navbar, footer, logo, event cards, countdown, …
src/lib/content.ts    ← loads and checks /content (build errors point to the bad entry)
src/lib/metadata.ts   ← SEO and Open Graph tags for each page
```

## Accessibility and privacy

- Semantic HTML, a skip link, visible keyboard focus, and labelled icons and buttons.
- Colour contrast meets WCAG AA in both themes. Animations are turned off for visitors who prefer reduced motion.
- No cookies, no analytics, no tracking. The only thing stored in the browser is the light/dark choice.
