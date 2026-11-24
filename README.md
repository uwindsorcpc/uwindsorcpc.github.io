# CPC UWindsor website

The website for **CPC UWindsor**, the UWindsor Competitive Programming Club.

Built with Next.js (App Router), TypeScript and Tailwind CSS. The whole site is **static**: there is no backend, no database, no analytics and no paid services. `npm run build` produces plain HTML files, which GitHub Pages serves for free at **https://uwindsorcpc.github.io**.

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

You can edit files right on GitHub (open the file → pencil icon → **Commit changes**). The site redeploys automatically within about 2 minutes. If the change has a mistake, the run shows a red ❌ on the repo's **Actions** tab and the live site stays as it was.

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
2. Check that `url` in `content/site.json` is the real address (`https://uwindsorcpc.github.io`). Search engines and link previews use it.
3. Replace the sample events, team, past contests and About text.
4. Set `"showSampleContentBanner": false` in `content/site.json`.

Until a link is filled in, the site shows a greyed-out **"link coming soon"** button instead of a broken link, so it's safe to deploy early.

---

## Deploying to GitHub Pages (free)

The site is published at **https://uwindsorcpc.github.io** from the `uwindsorcpc/uwindsorcpc.github.io` repository. The workflow in `.github/workflows/deploy.yml` does all the work:

1. On every push to `main`, it installs packages, runs the linter, and builds the site into `/out`.
2. If the build passes, it publishes `/out` to GitHub Pages. The live site updates in about 1–2 minutes.
3. If the build fails (for example a missing comma in a JSON file), nothing is published and the live site stays as it was. Open the repo's **Actions** tab to see the error.

You can also redeploy by hand: **Actions → Deploy to GitHub Pages → Run workflow**.

### One-time setup

Only needed once, when the site first moves to the club organization:

1. Create the free GitHub organization `uwindsorcpc` and add the execs as **Owners**.
2. The repository must be named exactly **`uwindsorcpc.github.io`** inside that organization. That name is what makes the site live at the root address.
3. The repository must be **public**. GitHub Pages is free only for public repositories.
4. In the repository, go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.
5. Push to `main`, or run the workflow by hand. The deploy step is skipped while the repository is private, so the workflow is safe to keep before setup is finished.

**Custom domain (optional):** if the club buys a domain, add it under **Settings → Pages → Custom domain**, then update `url` in `content/site.json`.

> The site has no server code, environment variables or secrets. `next.config.ts` uses `output: "export"`, so the build fails loudly if anyone adds something that needs a server. The same `/out` folder would also deploy unchanged to any other static host, such as Vercel or Netlify.

---

## Changing the look

- **Colours:** every colour is a CSS variable at the top of `src/app/globals.css`, with one block for dark mode (the default) and one for light mode. Change them there and the whole site follows. If you change `--bg` or `--accent`, also update the hex values in `src/app/icon.svg`, `src/app/og.png/route.tsx` (the social preview image) and `src/app/apple-touch-icon.png/route.tsx` (the iPhone icon).
- **Logo:** the wordmark is text, built in `src/components/Logo.tsx`. The square favicon is `src/app/icon.svg`.
- **Fonts:** Geist (text) and JetBrains Mono (code accents), set in `src/app/layout.tsx`. They're downloaded at build time and served from the site itself, so visitors never contact Google.

## Project structure

```
content/              ← everything editable (see above)
public/               ← static files such as team photos (public/team/)
src/app/              ← one folder per page (about/, events/, …), layout, favicon, social image (og.png/)
.github/workflows/    ← automatic build and deploy to GitHub Pages
src/components/       ← navbar, footer, logo, event cards, countdown, …
src/lib/content.ts    ← loads and checks /content (build errors point to the bad entry)
src/lib/metadata.ts   ← SEO and Open Graph tags for each page
```

## Accessibility and privacy

- Semantic HTML, a skip link, visible keyboard focus, and labelled icons and buttons.
- Colour contrast meets WCAG AA in both themes. Animations are turned off for visitors who prefer reduced motion.
- No cookies, no analytics, no tracking. The only thing stored in the browser is the light/dark choice.
