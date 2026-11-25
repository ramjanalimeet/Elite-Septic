# Elite Septic website copy

This repository contains a static copy of the public pages at [elitesepticservice.net](https://elitesepticservice.net/), including service and location pages, blog posts, images, styles, and scripts. The pages are saved at their original URL paths.

## Run locally

From the repository root:

```sh
python3 -m http.server 3001
```

Open `http://localhost:3001/`. No build or package installation is needed.

## Refresh the copy

```sh
python3 scripts/mirror_site.py
```

The refresh script reads the public XML sitemaps and downloads their pages and first party assets. It requires access to `elitesepticservice.net`. Generated pages retain the original site design and internal links.

## Deploy to Cloudflare Workers

Commit and push the website and deployment files to the branch connected to Cloudflare first. Use the repository root as the root directory and these build settings:

| Setting | Value |
| --- | --- |
| Build command | `npm run build` |
| Deploy command | `npm run deploy` |
| Preview command | `npm run preview` |

Cloudflare installs the dependencies from `package-lock.json`. `wrangler.jsonc` sets the required compatibility date and serves the generated `dist/` directory. Wrangler also runs the build automatically, so direct `npx wrangler deploy` works. Remove the previous `--assets .` override: it would publish the repository root instead of the prepared website directory.

To check the deployment package locally without publishing:

```sh
npm ci
npm run deploy -- --dry-run
```

## Forms and external services

The public website retains its static page design. Estimate and booking forms use `mirror.js` to submit to the Worker API and store requests in the protected lead inbox. Booking requests require administrator confirmation. Analytics and external WordPress widgets are not hosted here.

## Lead dashboard

`/leads/` is a responsive dashboard with protected APIs, Cloudflare D1 storage, search, status/service filters, notes, booking dates, manual lead entry, deletion, and CSV export. Public quote and booking forms send requests to `/api/submissions`. The production inbox starts empty; local test data is not published.

Run the dashboard locally:

```sh
npm ci
npx wrangler d1 migrations apply elite-septic-leads --local
npm run dev
```

Set `DASHBOARD_PASSWORD` in an ignored `.dev.vars` file for local sign-in. Sign-in uses only the dashboard password. For production, configure `DASHBOARD_PASSWORD` as a Cloudflare Worker secret and apply D1 migrations with `npx wrangler d1 migrations apply elite-septic-leads --remote` before deployment. Never commit credentials. The D1 binding is declared in `wrangler.jsonc`.

Sessions use a random token in a secure, HttpOnly, SameSite cookie. API mutations require a matching origin; login and public form submissions are rate limited. Public requests are saved as new leads; a preferred booking date is a request until the administrator marks it Scheduled.
