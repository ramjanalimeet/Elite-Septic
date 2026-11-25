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

This is a static copy, so WordPress form processing, booking storage, analytics, and external widgets are not hosted here. The estimate and booking forms use `mirror.js` to open a prefilled email draft to the contact address published on the source site. The visitor must send that draft from their email application. Production form submissions require a separate backend and mail configuration.
