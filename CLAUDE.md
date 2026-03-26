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
│   └── package.json                # Separate deps for serverless runtime
├── specs/                          # API specification documents (PDFs)
├── next.config.js                  # Static export to serverless-functions/assets
├── .env.example                    # NEXT_PUBLIC_DEFAULT_URI
└── package.json                    # Frontend deps
```

## Commands

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
npm run deploy        # Deploy to Twilio
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

## Conventions

- UI components use **Twilio Paste** — always prefer Paste components over raw HTML or other libraries.
- Frontend is TypeScript; serverless functions are JavaScript.
- No test suite currently exists (`npm test` in serverless-functions is a no-op).
- Serverless runtime is `node20` (configured in both `package.json` engines and `.twilioserverlessrc`).
- Branch `main` is the main branch; `public-beta` is the active development branch.
- Git remote is named `github` (not `origin`).
