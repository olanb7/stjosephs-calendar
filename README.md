# stjosephspta-calendar

Scheduled GitHub Actions job that scrapes the public St Joseph's Primary School ASP.NET calendar and republishes it as a stable public iCal feed on a dedicated public GitHub branch.

## What it does

- loads `https://www.stjosephsps.co.uk/Calendar`
- follows ASP.NET Web Forms postbacks to move month-by-month
- follows each event postback to reach the detail pane with exact start/end date-times
- normalizes and deduplicates events
- generates an `.ics` feed
- writes the feed to disk for local use or branch-based publishing

## Stack

- **Runtime:** Node.js + TypeScript
- **Automation:** GitHub Actions
- **Public feed hosting:** dedicated public GitHub branch

## Project layout

- `src/app/` orchestration logic
- `src/source/` ASP.NET client and HTML parsers
- `src/feed/` iCal generation
- `src/publish/` local file publishing
- `.github/workflows/` CI and branch publishing automation

## Local development

1. Install dependencies:

```bash
npm ci
```

2. Run the scraper without publishing:

```bash
npm run scrape
```

3. Run a full local publish:

```bash
npm run publish
```

By default this writes `dist/output/stjosephsps.ics`. Override `OUTPUT_FILE_PATH` if you want a different target:

```bash
OUTPUT_FILE_PATH=public/stjosephsps.ics npm run publish
```

4. Run tests and build:

```bash
npm run lint
npm test
npm run build
```

## Public branch deployment

The feed is published by `.github/workflows/publish.yml`.

It runs:

1. on a daily schedule
2. on manual dispatch
3. on pushes to `main`

The workflow:

1. installs dependencies
2. lints, tests, and builds the project
3. generates `dist/output/stjosephsps.ics`
4. force-updates the dedicated `calendar-feed` branch with the generated ICS file

### Repository setup

Keep the repository public so the raw branch URL stays accessible. No GitHub Pages setup is required.

### Subscription URL

After the first successful deployment, the feed URL will be:

```text
https://raw.githubusercontent.com/<owner>/<repo>/calendar-feed/stjosephsps.ics
```

## Notes

- The source school site currently needs relaxed TLS verification in this environment; keep `ALLOW_INSECURE_TLS=false` unless the source certificate chain forces a temporary exception.
- Multi-day events appear on multiple days in the month view, so the scraper deduplicates by stable event identity before generating the feed.
- This approach keeps everything on GitHub Free, but GitHub controls the caching headers on `raw.githubusercontent.com`.
