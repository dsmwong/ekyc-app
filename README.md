# Compliance Embedded eKYC App

A Next.js frontend + Twilio Serverless Functions backend that demonstrates Twilio's embedded compliance verification flows for ISVs. Built with [Twilio Paste](https://paste.twilio.design) design system.

## Supported Compliance Products

- **Secondary Customer Profile** — ISV customer identity verification
- **Toll-Free Verification** — Toll-free number verification
- **Regulatory Bundle** — Phone number regulatory compliance (multi-country)
- **Alphanumeric Sender ID** — Australia alphanumeric sender ID registration (ACMA)
- **A2P 10DLC Brand** — Brand registration (coming soon)
- **Branded Calling** — (coming soon)

All flows support an optional **Target Account** selector that routes the compliance request to a Twilio subaccount (auth tokens are resolved server-side; the browser never sees them).

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Twilio Paste
- **Backend**: Twilio Serverless Functions (Node 20), Twilio SDK, Axios
- **Compliance Embed**: `@twilio/twilio-compliance-embed` SDK

## Prerequisites

- Node.js 20+ (see `.nvmrc`)
- [Twilio CLI](https://www.twilio.com/docs/twilio-cli/quickstart) with a configured profile
- A Twilio account with compliance/Trust Hub access

## Setup

1. **Install dependencies**

```bash
# Frontend
npm install

# Serverless functions
cd serverless-functions
npm install
```

2. **Configure environment**

```bash
# Frontend - copy and edit
cp .env.example .env
# Set NEXT_PUBLIC_DEFAULT_URI to your serverless functions base URL

# Serverless - copy and edit
cd serverless-functions
cp .env.example .env
# Set ACCOUNT_SID, AUTH_TOKEN, PRIMARY_CUSTOMER_PROFILE_SID,
# NOTIFICATION_EMAIL, SYNC_SERVICE_SID
```

## Development

```bash
# Start frontend dev server (port 3000)
npm run dev

# Start serverless functions locally (from serverless-functions/)
cd serverless-functions
npm start
```

## Build & Deploy

```bash
# Build frontend (outputs static site to serverless-functions/assets/)
npm run build

# Deploy everything to Twilio (from serverless-functions/)
cd serverless-functions
npm run deploy
```

## Project Structure

```
ekyc-app/
├── pages/index.tsx                 # Main SPA with product type selector
├── app/components/                 # React components
│   └── ComplianceEmbeddedWrapper.tsx  # Handles API calls & renders embed
├── serverless-functions/
│   ├── functions/                  # Backend API endpoints
│   │   ├── initCustomerProfile.js
│   │   ├── initTollFreeVerification.js
│   │   ├── initRegulatoryBundle.js
│   │   ├── initSenderIdRegistration.js
│   │   ├── initBrandRegistration.js
│   │   ├── checkRegulation.js
│   │   ├── fetchUnverifiedTFNumbers.js
│   │   ├── fetchSubaccountList.js
│   │   ├── fetchSubaccountAuthToken.private.js  # Private helper (not HTTP-exposed)
│   │   ├── getTwilioCredentials.private.js      # Private helper — resolves parent/subaccount creds
│   │   ├── test/
│   │   │   ├── fetchSubaccountAuthToken.js      # Test wrapper for fetchSubaccountAuthToken
│   │   │   └── getTwilioCredentials.js          # Test wrapper for getTwilioCredentials
│   │   └── utilities/cors-response.js
│   ├── assets/                     # Built frontend (git-ignored)
│   ├── .env                        # Twilio credentials (git-ignored)
│   └── package.json
├── specs/                          # API specification documents
├── next.config.js                  # Static export config
├── .env.example
└── package.json
```

## Serverless Function Endpoints

| Endpoint | Description | API |
|----------|-------------|-----|
| `initCustomerProfile` | Secondary Customer Profile inquiry | Trust Hub v1 |
| `initTollFreeVerification` | Toll-free number verification | Trust Hub v1 |
| `initRegulatoryBundle` | Regulatory bundle registration | Trust Hub v3 |
| `initSenderIdRegistration` | AU Alphanumeric Sender ID registration | Numbers v1 |
| `initBrandRegistration` | A2P 10DLC brand registration | Trust Hub v3 |
| `checkRegulation` | Look up regulation SID by country/type | Sync Map |
| `fetchUnverifiedTFNumbers` | List unverified toll-free numbers | Incoming Phone Numbers |
| `fetchSubaccountList` | List subaccounts | Accounts API |
| `fetchSubaccountAuthToken.private` | Fetch a subaccount's auth token (private — callable only from another Function via `Runtime.getFunctions()`) | Accounts API |
| `getTwilioCredentials.private` | Resolve parent or subaccount `{accountSid, authToken}` for use by other Functions (private) | Accounts API |
| `test/fetchSubaccountAuthToken` | Public test wrapper that verifies the private helper is reachable. Returns `hasAuthToken: true/false` only — never leaks the token | Accounts API |
| `test/getTwilioCredentials` | Public test wrapper for `getTwilioCredentials`. Returns `{ ok, accountSid, usingParent, hasAuthToken }` — never leaks the token | Accounts API |

### Subaccount Selection

Each `init*` function and `fetchUnverifiedTFNumbers` accepts an optional `subaccountSid` query parameter. When provided, the backend:

1. Validates that the SID belongs to a subaccount of the configured parent account.
2. Fetches the subaccount's auth token server-side.
3. Uses those credentials for the outbound Twilio API call — the resulting compliance resource is created under the selected subaccount.

If `subaccountSid` is omitted, the parent account credentials are used (existing behaviour).

The frontend exposes this as a **Target Account** Combobox at the top of the form, populated from `/fetchSubaccountList`. Selecting a subaccount also namespaces cached `CustomerId` / `RegistrationId` localStorage keys with `.<subaccountSid>` so values don't leak across accounts.

```bash
# Example: create a Secondary Customer Profile under a specific subaccount
curl "https://<your-service>.twil.io/initCustomerProfile?subaccountSid=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

### Testing the private subaccount auth token helper

The private helper is not directly HTTP-callable. To verify it's working after deploy, hit the public test wrapper (it confirms a token was retrieved without returning it):

```bash
# Test wrapper (returns { ok, sid, friendlyName, status, hasAuthToken })
curl "https://<your-service>.twil.io/test/fetchSubaccountAuthToken?subaccountSid=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# Direct call to the private helper — should return 403 in production
curl -i "https://<your-service>.twil.io/fetchSubaccountAuthToken?subaccountSid=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

You can also run the end-to-end test scripts against a deployed environment:

```bash
cd serverless-functions
node scripts/test-subaccount-auth-token.js --base https://<your-service>.twil.io
node scripts/test-subaccount-credentials.js --base https://<your-service>.twil.io
```
