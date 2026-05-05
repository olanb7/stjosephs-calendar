# stjosephspta-calendar

Daily Azure Functions job that scrapes the public St Joseph's Primary School ASP.NET calendar and republishes it as a stable public iCal feed.

## What it does

- loads `https://www.stjosephsps.co.uk/Calendar`
- follows ASP.NET Web Forms postbacks to move month-by-month
- follows each event postback to reach the detail pane with exact start/end date-times
- normalizes and deduplicates events
- generates an `.ics` feed
- publishes the feed to Azure Blob Storage so parents get a stable subscribe URL

## Stack

- **Runtime:** Node.js + TypeScript
- **Serverless host:** Azure Functions Timer Trigger
- **Public feed storage:** Azure Blob Storage
- **Infrastructure as code:** Bicep
- **CI/CD:** GitHub Actions with Azure login via OIDC

## Project layout

- `src/app/` orchestration logic
- `src/source/` ASP.NET client and HTML parsers
- `src/feed/` iCal generation
- `src/publish/` feed publishing backends
- `src/functions/` Azure Functions entrypoints
- `infra/` Azure Bicep templates
- `.github/workflows/` CI and deploy automation

## Local development

1. Copy `local.settings.example.json` to `local.settings.json` and adjust values as needed.
2. Install dependencies:

```bash
npm ci
```

3. Run the scraper without publishing to Azure:

```bash
npm run scrape
```

4. Run a full local publish. Without blob credentials it writes to `dist/output/stjosephsps.ics`:

```bash
npm run publish
```

5. Run tests and build:

```bash
npm run lint
npm test
npm run build
```

## Azure deployment

### Required GitHub repository secrets

- `AZURE_CLIENT_ID`
- `AZURE_TENANT_ID`
- `AZURE_SUBSCRIPTION_ID`

These should come from an Azure Entra app/service principal configured for GitHub OIDC.

### Required GitHub repository variables

- `AZURE_LOCATION`
- `AZURE_RESOURCE_GROUP`
- `AZURE_NAME_PREFIX`
- `AZURE_FUNCTION_APP_NAME`
- `AZURE_STORAGE_ACCOUNT_NAME`

Optional:

- `FEED_CONTAINER_NAME`
- `FEED_BLOB_NAME`

### What the deploy workflow does

1. installs dependencies
2. lints, tests, and builds the project
3. logs into Azure using OIDC
4. ensures the resource group exists
5. runs `infra/main.bicep`
6. zips the built Function App payload
7. deploys the package to Azure Functions

The Bicep template provisions:

- one storage account
- one public blob container for the ICS file
- one Application Insights instance
- one Linux consumption Function App

## Subscription URL

After deployment, the public feed URL is:

```text
https://<storage-account>.blob.core.windows.net/<container>/<blob-name>
```

The exact URL is also emitted by the deploy workflow from the Bicep outputs.

## Notes

- The source school site currently needs relaxed TLS verification in this environment; production should keep `ALLOW_INSECURE_TLS=false` unless the source certificate chain forces a temporary exception.
- Multi-day events appear on multiple days in the month view, so the scraper deduplicates by stable event identity before generating the feed.
