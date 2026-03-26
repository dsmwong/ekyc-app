# Compliance Embedded eKYC App

A Next.js frontend + Twilio Serverless Functions backend that demonstrates Twilio's embedded compliance verification flows for ISVs. Built with [Twilio Paste](https://paste.twilio.design) design system.

## Supported Compliance Products

- **Secondary Customer Profile** — ISV customer identity verification
- **Toll-Free Verification** — Toll-free number verification
- **Regulatory Bundle** — Phone number regulatory compliance (multi-country)
- **Alphanumeric Sender ID** — Australia alphanumeric sender ID registration (ACMA)
- **A2P 10DLC Brand** — Brand registration (coming soon)
- **Branded Calling** — (coming soon)

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
