# Virelo Links

> ⚡ **WE DON'T COMPETE ON QUALITY. WE LEAD IT.**

## Overview

**Virelo Links** is the official link hub of **Virelo Academy** — a public, bilingual (English / Arabic) page that lists the academy's official links, plus a protected admin dashboard that lets the team manage those links without touching the source code.

- **Public page** — reads the links from the database on every visit, shows only the *enabled* ones, sorted by their *Order* number, with a special style for *featured* links.
- **Admin dashboard** — sign in, then add, edit, delete, enable/disable, feature and re-order links.
- **No build step and no npm dependencies.** Plain HTML, CSS and JavaScript on the front end; small Node.js serverless functions on the back end; Upstash Redis for storage.

## Brand

| | |
|---|---|
| Name | Virelo Academy |
| Tagline | WE DON'T COMPETE ON QUALITY. WE LEAD IT. |
| Navy | `#071A33` |
| Gold | `#D4AF37` |
| White | `#FFFFFF` |
| Fonts | Montserrat (English), Cairo (Arabic) — loaded from Google Fonts with system-font fallbacks |

All colours, spacing, radii, shadows and motion timings are CSS custom properties at the top of `public/css/style.css`.

## Features

**Public page**
- Links loaded from the database (nothing is hard-coded in the HTML); loading, empty and error states with a retry button
- Enabled links only, sorted by `order` ascending; featured links get a gold border, top accent line and soft glow
- Social icon row built automatically from links that use a social icon (Instagram, Facebook, YouTube, TikTok, WhatsApp, Telegram, LinkedIn)
- EN / AR switch with proper `lang` / `dir` (LTR ↔ RTL); choice kept for the browser session; link titles and descriptions follow the visitor's language when a translation exists
- **Scan** (QR code of the current page) and **Share** (Web Share API with clipboard fallback)
- `link-click` browser event on every link click, ready for an analytics hook
- Responsive from 320 px to desktop, reduced-motion support, keyboard-focus styles, safe external links
- No reference to the admin area anywhere on the page

**Admin dashboard**
- Login screen with show/hide password, loading / error / success states, generic error messages
- Summary cards: Total, Active, Featured, Categories
- Create, edit, delete (with confirmation dialog), enable / disable, featured and order for every link
- Controlled icon picker (18 built-in icons), category field with suggestions and support for new categories
- Optional English and Arabic translations per link
- Instant form validation plus authoritative server-side validation
- Table on desktop, cards on mobile; English by default with an Arabic interface option
- Two administrator accounts, protected routes, logout

## Project Structure

```text
virelo-links/
├── api/                          Vercel serverless functions (Node.js, ES modules)
│   ├── links.js                  PUBLIC  GET  /api/links          enabled links, sorted by order
│   └── admin/
│       ├── login.js              POST /api/admin/login            verify credentials, set session cookie
│       ├── logout.js             POST /api/admin/logout           clear session cookie
│       ├── session.js            GET  /api/admin/session          who am I?
│       ├── dashboard-page.js     GET  /admin/dashboard            serves the dashboard only to signed-in admins
│       └── links/
│           ├── index.js          GET (list all) / POST (create)   /api/admin/links
│           └── [id].js           PATCH|PUT (update) / DELETE      /api/admin/links/:id
├── lib/                          Server-only code (never served to browsers)
│   ├── auth.js                   scrypt password hashing, signed session cookies, requireAdmin()
│   ├── http.js                   JSON helpers, cookie parsing, same-origin check, error wrapper
│   ├── links-repo.js             create / read / update / delete / sort links; one-time seeding
│   ├── seed-links.js             the initial links written on first run
│   └── store.js                  storage adapters: Upstash Redis (production) and a JSON file (local dev only)
├── private/
│   └── dashboard.html            dashboard markup — only ever sent after authentication
├── public/                       Everything here is served as static files
│   ├── index.html                public link hub
│   ├── admin/index.html          admin login screen  (https://…/admin)
│   ├── css/
│   │   ├── style.css             design tokens + public page + shared components
│   │   └── admin.css             login and dashboard styles
│   ├── js/
│   │   ├── script.js             public page: fetch links, render, language, Scan, Share
│   │   ├── icons.js              icon registry — single source for public page, admin and server validation
│   │   ├── link-schema.js        link model + validation, shared by the admin form and the API
│   │   ├── admin-login.js        login form logic
│   │   ├── admin-dashboard.js    dashboard logic (list, form, delete, toggles, toasts)
│   │   ├── admin-i18n.js         admin interface strings (EN / AR)
│   │   └── vendor/qrcode.min.js  qrcode-generator 1.4.4 (MIT), served locally
│   └── assets/
│       ├── logo/virelo-logo.png  official logo (favicon, header, hero, login)
│       ├── images/  icons/       reserved (empty)
├── scripts/
│   ├── dev-server.mjs            local server that mimics Vercel (static files, /api functions, rewrites, headers)
│   └── make-admin-env.mjs        generates SESSION_SECRET and the hashed ADMIN_ACCOUNTS value
├── tests/
│   ├── api.test.mjs              14 automated tests (auth, CRUD, validation, security, persistence)
│   └── mock-upstash.mjs          in-memory Upstash REST server used by the tests
├── vercel.json                   output directory, /admin/dashboard rewrite, security headers
├── package.json                  scripts only — there are no dependencies
├── .env.example                  names of the environment variables (no values)
└── .gitignore
```

Only `public/` is exposed as static files. `api/`, `lib/`, `private/`, `scripts/` and `tests/` are never served (the tests check this).

## Technologies

| Layer | Used |
|---|---|
| Front end | HTML5, CSS3 (custom properties, Grid, Flexbox, logical properties), vanilla JavaScript (ES modules) |
| Back end | Node.js (≥ 20) serverless functions on Vercel; built-in `node:crypto` for scrypt hashing and HMAC signing |
| Storage | Upstash Redis (REST API) in production; a local JSON file in development |
| QR codes | qrcode-generator 1.4.4 (vendored in `public/js/vendor/`) |
| Fonts | Google Fonts: Montserrat, Cairo |
| Hosting | Vercel |
| Tests | Node's built-in test runner (`node --test`) |

There is no framework, bundler, Supabase, or external npm package.

## Public URL

https://virelolinks.vercel.app/

## Admin URL

https://virelolinks.vercel.app/admin

The admin area is deliberately not linked from the public page. Unauthenticated visits to `/admin/dashboard` are redirected to `/admin`.

## Admin Users

| Name | Username |
|---|---|
| Eng. Mark Medhat | `mark.medhat` |
| Eng. Mayer Romany | `mayer.romany` |

Initial passwords were configured during deployment. Store them securely outside the repository.

> **Recommendation — change the initial passwords.** They were written down in a project brief to set the system up, so treat them as compromised and replace them with new ones (generated by a password manager) as soon as the deployment works. This project has **no in-app password-change screen** (accounts live in an environment variable by design), so a change means re-running `npm run make-admin-env` and updating the environment variable — see [Password management](#password-management).

## Local Development

Requirements: Node.js 20 or newer. Nothing else.

1. **Clone** the repository and enter it:
   ```bash
   git clone <your-repository-url> virelo-links
   cd virelo-links
   ```
2. **Install dependencies** — there are none, so `npm install` is not needed.
3. **Configure environment variables.** Generate the two secrets (you will be prompted for each admin password; typing is hidden):
   ```bash
   npm run make-admin-env
   ```
   Copy the two printed lines into a new file named `.env.local` (it is git-ignored). Wrap the `ADMIN_ACCOUNTS` value in single quotes:
   ```bash
   SESSION_SECRET=...
   ADMIN_ACCOUNTS='[{"username":"mark.medhat", ...}]'
   ```
   Leave the Upstash variables empty locally — links are then stored in `.data/dev-store.json`.
4. **Start the development server:**
   ```bash
   npm run dev
   ```
5. **Open** http://localhost:3000 (public) and http://localhost:3000/admin (admin).

Run the automated tests with `npm test`. The first request after a fresh start creates the initial links; delete `.data/` to reset the local data.

## Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `SESSION_SECRET` | yes | 32+ random characters; signs session cookies. Changing it signs everyone out. |
| `ADMIN_ACCOUNTS` | yes | JSON array of `{ username, name, hash }` — scrypt **hashes**, never passwords. |
| `UPSTASH_REDIS_REST_URL` | production | Upstash Redis REST endpoint. Added automatically by the Vercel Marketplace integration. |
| `UPSTASH_REDIS_REST_TOKEN` | production | Token for the endpoint above. |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | alternative | Accepted instead of the two `UPSTASH_…` names (older Vercel KV naming). |
| `VIRELO_DEV_STORE` | no | Path of the local JSON store (default `.data/dev-store.json`). Development only. |
| `PORT` | no | Port of `npm run dev` (default `3000`). |
| `ADMIN_PW_MARK_MEDHAT`, `ADMIN_PW_MAYER_ROMANY` | no | Lets `make-admin-env` run without prompts (CI). Do not keep these in files. |

On Vercel, if the Upstash variables are missing the API returns a generic error — it never falls back to the local file there. `.env.example` lists the names only.

## Database

Storage is Upstash Redis, accessed through its REST API (`lib/store.js`). There is no SQL schema; the data model is:

| Redis key | Type | Contents |
|---|---|---|
| `virelo:links` | hash | field = link `id`, value = the link as JSON |
| `virelo:links:seeded` | string | set once (`SET … NX`) so the initial links are written exactly once; deleting every link later does **not** re-create them |
| `virelo:rl:login:<ip>` | counter | failed-login counter, expires after 15 minutes |

**Link model**

```json
{
  "id": "uuid",
  "title": "Official Virelo Academy Website",
  "description": "Visit the official Virelo Academy website",
  "url": "https://virelo-academy-system.vercel.app",
  "icon": "website",
  "category": "Platform",
  "featured": true,
  "enabled": true,
  "order": 1,
  "translations": { "ar": { "title": "…", "description": "…" } },
  "createdAt": "ISO-8601",
  "updatedAt": "ISO-8601"
}
```

| Field | Rules |
|---|---|
| `title` | required, ≤ 80 characters |
| `description` | optional, ≤ 240 characters |
| `url` | required; must be a valid `http://` or `https://` URL without embedded credentials; stored exactly as entered |
| `icon` | must be one of the registered icons |
| `category` | required, ≤ 40 characters; matched case-insensitively to existing categories |
| `featured`, `enabled` | booleans |
| `order` | whole number 0–9999; left empty on create ⇒ added after the current last link |
| `translations` | optional `en` / `ar` `{ title, description }` |

**Admin authentication** is not stored in the database: admins come from the `ADMIN_ACCOUNTS` environment variable (hashes only).

**Security policies:** Redis is reachable only from the server functions using the secret token; browsers never talk to it. The public endpoint returns only `id, title, description, url, icon, category, featured, order, translations` of enabled links.

**Seed data** (`lib/seed-links.js`): the three official system links (website, `تسجيل البيانات`, `دفع الحصة`, orders 1–3, all featured) followed by the original six links (Instagram, Facebook, WhatsApp, TikTok, WhatsApp Community, WhatsApp Channel — URLs unchanged, orders 4–9). English text for the two Arabic links and an Arabic title for the website link were added as translations; edit them from the dashboard if you prefer different wording.

## Link Management

Sign in at `/admin`, then use the dashboard:

| Task | How |
|---|---|
| **Add** | **+ Add Link** → fill the form → **Save** |
| **Edit** | **Edit** on the row → change fields → **Save** |
| **Delete** | **Delete** → confirm in the dialog (cannot be undone) |
| **Disable / enable** | **Disable** / **Enable** on the row. Disabled links disappear from the public page but stay in the dashboard. |
| **Feature** | Edit the link → *Featured* = Yes (gold border and glow on the public page) |
| **Reorder** | Edit the link → change *Order* |

Changes are saved immediately. Public visitors see them on their next page load; the CDN may keep the previous list for up to about a minute.

## Adding a New Link

Example: a Telegram channel.

1. Open `/admin` and sign in.
2. Click **+ Add Link**.
3. **Title:** `Telegram Channel` · **Description:** `Join the Virelo Academy Telegram channel` · **URL:** `https://t.me/your-channel` (use the real address).
4. **Icon:** choose *Telegram*. **Category:** type `Social` (or pick it from the suggestions).
5. **Featured:** No · **Enabled:** Yes · **Order:** `10` (or leave empty to add it last).
6. Optional: open *Translations* and add an Arabic title and description.
7. Click **Save** — you should see “Link added successfully.” — then open the public page to check it. Because *Telegram* is a social icon, it also appears in the round social icons row.

## Changing Link Order

The public page sorts enabled links by **Order ascending** — the lowest number is at the top. Links with the same number are shown oldest first. `0` is allowed if you need a position above `1`. Gaps are fine (`10, 20, 30`), which makes it easy to slot a link in later without renumbering.

## Categories

A category is a free-text label (≤ 40 characters). The suggestions are *Platform, Registration, Payment, Education, Social, Community, Contact, Other* plus every category already in use, and you can type any new name. If you type a name that already exists in a different case (`social`), the existing spelling (`Social`) is reused. The **Categories** card counts the distinct categories in use. The public page does not group by category; it is stored with each link (and sent with the `link-click` event) for organisation and future analytics.

## Icons

Built-in icons: `website`, `registration`, `payment`, `instagram`, `facebook`, `youtube`, `tiktok`, `whatsapp`, `community`, `channel`, `education`, `book`, `exam`, `student`, `contact`, `telegram`, `linkedin`, `external-link`. Admins choose from this fixed set — nobody uploads images — and the server rejects any other name.

**Add another icon:** open `public/js/icons.js` and add one entry to `ICONS`:

```js
'my-icon': { label: 'My icon', shapes: [['path', { d: '…' }]] },   // add  social: true  to also show it in the social row
```

Shapes are drawn on a 24 × 24 grid (stroke style). The admin picker, the public page and the server-side validation all read this file, so nothing else needs to change. Deploy, and the icon is available.

## Authentication

1. The login form posts `username` + `password` to `POST /api/admin/login`.
2. The server finds the account in `ADMIN_ACCOUNTS` and verifies the password against its **scrypt** hash (random salt, timing-safe comparison). Unknown usernames take the same time as wrong passwords.
3. On success the server sets the `vl_session` cookie: HMAC-SHA256 signed, **HttpOnly**, **SameSite=Strict**, **Secure** on HTTPS, valid for 8 hours.
4. `/admin/dashboard` is rewritten to `api/admin/dashboard-page.js`, which sends the dashboard HTML only if the cookie is valid — otherwise it redirects to `/admin`.
5. Every admin API route calls `requireAdmin()` first; without a valid session it returns `401`.
6. **Log out** posts to `/api/admin/logout`, which clears the cookie.

The login screen only ever says “Invalid username or password.”, “Too many attempts…” or a generic error — never technical details.

## Security

- **Secrets:** passwords are never stored or shipped — only scrypt hashes, in an environment variable. `SESSION_SECRET`, `ADMIN_ACCOUNTS` and the Upstash token exist only in Vercel's environment settings (and your local `.env.local`, which is git-ignored). Never commit them.
- **Authentication & authorization:** all create / update / delete / enable / feature / order operations require a valid session and are checked **on the server**; the front end is not trusted. Public visitors can only read enabled links.
- **Validation:** the same schema (`public/js/link-schema.js`) runs in the browser for quick feedback and on the server as the authority; non-http(s) URLs such as `javascript:` are rejected.
- **CSRF / abuse:** SameSite=Strict cookies, an `Origin` check on every state-changing request, and a login limit of 10 failed attempts per IP per 15 minutes.
- **Output safety:** admin-entered text is inserted with `textContent` only — never as HTML.
- **Headers** (`vercel.json`): Content-Security-Policy (scripts only from this site), `X-Frame-Options: DENY`, `nosniff`, HSTS, `Referrer-Policy`, `Permissions-Policy`; admin API responses are `no-store`; the dashboard is sent with `noindex`.
- **Public / private data:** the public API never includes `enabled`, timestamps or any account data.
- **Known limits:** sessions are stateless, so a single session can't be revoked early — rotate `SESSION_SECRET` to sign everyone out. The login limit is per IP address. There is no in-app password change (see below).

### Password management

To change a password (or add/remove an admin): run `npm run make-admin-env`, copy the new `ADMIN_ACCOUNTS` value into Vercel → Settings → Environment Variables (Production and Preview), and **redeploy**. Optionally replace `SESSION_SECRET` at the same time to end all existing sessions. Use long, unique passwords from a password manager.

## Deployment

1. Push the project to GitHub (check that no `.env*` file or secret is committed).
2. In Vercel, **Add New → Project**, import the repository. Framework preset: **Other**. Leave the build command empty — `vercel.json` already sets the output directory to `public`.
3. In the project, open **Storage** (or the Marketplace) and add **Upstash Redis**, connecting it to the project. This creates `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` (or the `KV_REST_API_*` equivalents) automatically.
4. Locally run `npm run make-admin-env`. In **Settings → Environment Variables** add `SESSION_SECRET` and `ADMIN_ACCOUNTS` for Production (and Preview if used). Paste `ADMIN_ACCOUNTS` as a single line, without quotes.
5. **Deploy** (or redeploy after adding variables — functions only see variables present at deploy time).
6. Optionally assign the domain `virelolinks.vercel.app` under **Settings → Domains**.
7. Open `/` — the initial links are created automatically on the first request. Then open `/admin` and sign in.

## Updating the Project

1. `git pull` the latest changes.
2. Create the change on a branch (code, styles, a new icon …). Link content does **not** need code changes — use the dashboard.
3. Test locally: `npm run dev` and `npm test`.
4. `git commit` with a clear message.
5. `git push` — Vercel builds a preview deployment for branches and a production deployment for the main branch.
6. Verify the **public page**: links, order, featured styling, EN/AR, mobile.
7. Verify the **admin page**: login, add/edit/disable/delete a test link, logout.
8. Add an entry to the [Changelog](#changelog).

## Troubleshooting

| Problem | Likely cause and fix |
|---|---|
| **Admin cannot log in** | Check the username (lowercase, e.g. `mark.medhat`). If it always says “Invalid username or password.”, the hash in `ADMIN_ACCOUNTS` doesn't match the password — regenerate with `npm run make-admin-env`. A generic error means `SESSION_SECRET` or `ADMIN_ACCOUNTS` is missing/invalid (see the function logs). “Too many attempts” — wait 15 minutes. |
| **Links do not appear** | The link may be disabled; the storage variables may be missing (the page shows “temporarily unavailable” + *Try again*); or the CDN is serving the previous list for up to a minute. |
| **Links appear in the wrong order** | Check the *Order* values; equal numbers sort oldest first. |
| **Database connection fails** | Confirm `UPSTASH_REDIS_REST_URL` / `_TOKEN` are set for the environment and that the Upstash database is active. Redeploy after changing variables. |
| **Vercel deployment fails** | Framework preset must be *Other*, no build command, Node.js 20+. Make sure `vercel.json` is committed. |
| **Environment variables missing** | They only apply to deployments created *after* they were added — redeploy. Locally, make sure `.env.local` exists and `ADMIN_ACCOUNTS` is wrapped in single quotes. |
| **Icons missing** | The link's icon name must exist in `public/js/icons.js`; clear the browser cache after editing that file. |
| **Arabic RTL looks wrong** | The page sets `dir="rtl"` / `lang="ar"` when AR is selected; check that Cairo is allowed to load (Google Fonts not blocked) and that the Arabic text is in the link's *Title* or *Translations → Arabic*. |
| **Dashboard shows “session expired”** | Sessions last 8 hours; sign in again. |

## Backup / Recovery

- **Code:** the Git repository is the backup of the application. Tag releases before big changes.
- **Secrets:** keep the admin passwords and a copy of the Vercel environment variables in a password manager — never in the repository.
- **Links (data):** the data lives in Upstash Redis. Make a regular export, and also use your Upstash dashboard's own backup options for the database.

**Export** — signed in, open the dashboard, open the browser console (F12) and run:

```js
const { links } = await (await fetch('/api/admin/links')).json();
Object.assign(document.createElement('a'), {
  href: URL.createObjectURL(new Blob([JSON.stringify(links, null, 2)], { type: 'application/json' })),
  download: 'virelo-links-backup.json'
}).click();
```

**Restore** — to an empty list, run the snippet below and paste the saved file's contents when asked (links get new IDs; order, text, translations and flags are kept):

```js
const backup = JSON.parse(prompt('Paste the backup JSON'));
for (const { id, createdAt, updatedAt, ...data } of backup) {
  const res = await fetch('/api/admin/links', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  console.log(data.title, res.status);
}
```

To start over from the built-in initial links, delete the keys `virelo:links` and `virelo:links:seeded` in the Upstash console; they are recreated on the next request.

## Future Development

Not implemented yet — possible next steps: analytics and click tracking (the `link-click` browser event is already emitted), link scheduling and expiration, custom themes, multiple link hub pages, advanced admin roles, drag-and-drop ordering, search and filters in the dashboard, link groups, dashboard analytics, in-app password change, and QR codes per link.

## Changelog

**2.2.0 — 2026-10-03**
- README rewritten as the full technical documentation (this file), matching the actual implementation.
- Public `/api/links` now tells browsers to always revalidate (CDN caching shortened to seconds), so disabling a link takes effect quickly.
- Dashboard: row actions stay on one line on wide screens. New test for the cache headers (14 tests).
- Verified end to end in a real browser: login for both admins, CRUD, enable/disable, featured, ordering, validation, persistence after refresh, EN/AR (RTL/LTR), mobile layouts, and backup/restore.

**2.1.0 — 2026-10-03**
- Admin system: protected `/admin` login and `/admin/dashboard`, link CRUD, enable/disable, featured, order, categories, controlled icon set, optional translations, Arabic admin interface.
- Public page now reads links from `/api/links` (Upstash Redis) instead of the HTML; added the three official Virelo Academy system links.
- Security: scrypt-hashed accounts, signed HttpOnly session cookies, server-side authorization, Origin checks, login rate limit, security headers.

**2.0.0 — 2026-10-02**
- Refactor of the single-file page into separate HTML / CSS / JavaScript files; new Virelo Master Style design; bilingual EN / AR with RTL; Scan (QR) and Share; responsive and accessible.

**1.0.0**
- Original single-file Official Links page.
