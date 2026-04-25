# CLAUDE.md

## Project Overview

Twilio Compliance Embedded eKYC application — a Next.js frontend + Twilio Serverless Functions backend that demonstrates embedded compliance verification flows (Secondary Customer Profile, Toll-Free Verification, Regulatory Bundles, Alphanumeric Sender ID, 10DLC Brand Registration).

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript 4.9, Twilio Paste Design System
- **Backend**: Twilio Serverless Functions (Node 20), Twilio SDK, Axios
- **Build**: Next.js static export → `serverless-functions/assets/`
- **Node**: v20 (`.nvmrc`)

## Project Structure

```
ekyc-app/
├── pages/                          # Next.js pages (index.tsx is the main SPA)
├── app/components/                 # React components (client-side)
├── serverless-functions/
│   ├── functions/                  # Twilio Functions (backend API endpoints)
│   │   └── utilities/cors-response.js  # Shared CORS utility
│   ├── assets/                     # Built Next.js static export (git-ignored)
│   ├── scripts/                    # Utility scripts for testing/cleanup
│   └── package.json                # Separate deps for serverless runtime
├── specs/                          # API specification documents (PDFs)
├── next.config.js                  # Static export to serverless-functions/assets
├── .env.example                    # NEXT_PUBLIC_DEFAULT_URI
└── package.json                    # Frontend deps
```

## Commands

> **IMPORTANT — working directory matters:**
> - **Frontend tasks** (build, dev, lint, tsc) must be run from the **top-level `ekyc-app/`** directory. The frontend `package.json` only lives at the top level.
> - **Serverless function tasks** (local dev, deploy, utility scripts) must be run from **`ekyc-app/serverless-functions/`**. That folder has its own `package.json` and `.env`.
> - **Typical deploy flow**: `cd ekyc-app/` → `npm run build` → `cd serverless-functions/` → `npm run deploy`. The frontend build outputs to `serverless-functions/assets/`, and the deploy command publishes both functions and those assets.

### Frontend (run from `ekyc-app/`)
```bash
npm install           # Install frontend dependencies
npm run dev           # Start Next.js dev server (port 3000)
npm run build         # Build static site → serverless-functions/assets/
npm run lint          # ESLint
npm run tsc           # TypeScript check (no emit)
```

### Serverless Functions (run from `ekyc-app/serverless-functions/`)
```bash
npm install           # Install serverless dependencies
npm start             # Local dev via twilio-run
npm run deploy        # Deploy to Twilio (includes built frontend assets)
```

## Key Architectural Decisions

- **Static export**: `next.config.js` outputs to `serverless-functions/assets/` so the frontend is served as a Twilio Asset alongside the Functions.
- **Dynamic imports**: `ComplianceEmbeddedWrapper` is loaded with `next/dynamic` (SSR disabled) because the Twilio Compliance Embed SDK is client-only.
- **Single page**: `pages/index.tsx` contains the main UI with sidebar navigation and conditional rendering for each compliance product type.
- **Serverless functions are plain JS** (not TypeScript). Each function handles one compliance API flow.
- **CORS**: All serverless functions use `utilities/cors-response.js` for CORS headers.
- **localStorage**: Used to persist `CustomerId` and `RegistrationId` keyed by country/type combination (regulatory bundles) or sender ID value (sender ID registrations).
- **Two API families**: Older products (Customer Profile, Toll-Free, Regulatory Bundle) use `trusthub.twilio.com` APIs. Alphanumeric Sender ID uses `numbers.twilio.com/v1/SenderIdRegistrations` with JSON body and a different response format (`embeddedSession.sessionId`/`sessionToken`).

## Environment Variables

- `NEXT_PUBLIC_DEFAULT_URI` — Base URL for the deployed Twilio Serverless Functions (e.g., `https://serverless-functions-xxxx-dev.twil.io/`)
- Serverless functions expect Twilio credentials (`ACCOUNT_SID`, `AUTH_TOKEN`) and service config (`SYNC_SERVICE_SID`, `PRIMARY_CUSTOMER_PROFILE_SID`, `NOTIFICATION_EMAIL`) set in the Twilio Functions environment.

## API Operations

### Deleting AU Sender ID Registration Bundles
Although AU Alphanumeric Sender ID registrations are **created** via `numbers.twilio.com/v1/SenderIdRegistrations`, the underlying resource is a TrustHub TrustProduct (SID prefix `BU`). The SenderIdRegistrations endpoint does **not** support DELETE — attempting it returns 404. To delete, use the TrustHub API:
```bash
curl -X DELETE https://trusthub.twilio.com/v1/TrustProducts/{BundleSid} \
  -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN"
```
A successful delete returns HTTP 204 No Content.

### Utility Scripts for Managing Trust Bundles

Two utility scripts are provided in `serverless-functions/scripts/` for managing TrustHub bundles (including AU Sender ID registrations). All scripts read `ACCOUNT_SID` and `AUTH_TOKEN` from the serverless-functions `.env` file. Run from `ekyc-app/serverless-functions/`:

**`list-trust-bundles.js`** — List TrustProducts with filtering options
```bash
# List all bundles
node scripts/list-trust-bundles.js

# Filter by status
node scripts/list-trust-bundles.js --status draft

# Filter by regulation ID
node scripts/list-trust-bundles.js --regulation RNa282dd7f3dbef8586501ca2e045e764c

# Shortcut for AU Sender ID regulation
node scripts/list-trust-bundles.js --au-sender-id

# Show detailed table with Policy/Regulation SIDs
node scripts/list-trust-bundles.js --detailed

# Combine filters
node scripts/list-trust-bundles.js --status twilio-approved --au-sender-id
```

**`manage-trust-bundle.js`** — Fetch or delete individual bundles by SID
```bash
# Fetch a single bundle
node scripts/manage-trust-bundle.js fetch BUxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Fetch multiple bundles with summary
node scripts/manage-trust-bundle.js fetch-multiple BUxxxx... BUyyyy...

# Delete a bundle (includes safety check for AU Sender ID bundles)
node scripts/manage-trust-bundle.js delete BUxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Force delete (skip AU Sender ID validation)
node scripts/manage-trust-bundle.js delete BUxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx --force
```

Note: AU Sender ID bundles created via the SenderIdRegistrations API may not appear in standard list queries but can be fetched directly by SID.

### Subaccount Auth Token (private helper)

`fetchSubaccountAuthToken.private.js` is a **private** helper (uses the `.private.js` Twilio Serverless convention) — it is NOT exposed as an HTTP endpoint and can only be invoked from another Function via `Runtime.getFunctions()`. The key omits the `.private` suffix:

```js
const { fetchSubaccountAuthToken } = require(
  Runtime.getFunctions()['fetchSubaccountAuthToken'].path
);
const result = await fetchSubaccountAuthToken(context, subaccountSid);
// result = { ok: true, data: { sid, friendlyName, status, authToken, ... } }
// or     = { ok: false, error: '...' }
```

The helper validates the SID format, confirms the target is a subaccount of the configured parent (`context.ACCOUNT_SID`), and returns the auth token.

A public test wrapper at `functions/test/fetchSubaccountAuthToken.js` (deployed as `/test/fetchSubaccountAuthToken`) proves the private helper is reachable; it returns `hasAuthToken: true/false` but **never exposes the raw auth token** in the HTTP response.

**Automated test** — `scripts/test-subaccount-auth-token.js` runs against either a local `twilio serverless:start` server or a deployed URL:
```bash
# Against local twilio-run (default http://localhost:3000)
node scripts/test-subaccount-auth-token.js

# Against a deployed environment
node scripts/test-subaccount-auth-token.js --base https://serverless-functions-xxxx-dev.twil.io
```

**Note on `.private.js` behaviour locally vs in production:**
- Locally (`twilio serverless:start`), twilio-run lists `.private.js` files as HTTP routes but invocation fails (500) because there's no `handler` export.
- In production, the Twilio runtime blocks HTTP access with 403.
The test script accepts any 4xx/5xx response as "not directly callable" and also verifies no auth token leaks in the response body.

## Conventions

- UI components use **Twilio Paste** — always prefer Paste components over raw HTML or other libraries.
- Frontend is TypeScript; serverless functions are JavaScript.
- No test suite currently exists (`npm test` in serverless-functions is a no-op).
- Serverless runtime is `node20` (configured in both `package.json` engines and `.twilioserverlessrc`).
- Branch `main` is the main branch; `public-beta` is the active development branch.
- Git remote is named `github` (not `origin`).
