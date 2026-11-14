# Jugaad — good things, again

A MEAN marketplace: **MongoDB, Express, Angular 22 and Node.js 24**. Three independently deployable domain services sit behind a same-origin gateway. The original React/SQLite prototype is retained in `legacy/` for reference and is not served.

## What works

- Register/sign in with a public alias; email addresses stay in the identity database.
- Browse and search listings, filter categories and publish a listing with an HTTPS photo URL.
- Send one offer per buyer per listing; sellers view offers and accept one. Atomic acceptance prevents double sales.
- Private buyer/seller conversations, refreshed on demand; participants cannot read other buyers’ threads.
- My exchanges shows listings, submitted offers and agreed sales.
- Responsive editorial design with floating forms, moving typography, hover effects, scroll reveals where supported and reduced-motion preferences. Inspired by the visual language of otsuka-air.jp, with original branding and CSS artwork.

This edition coordinates offers and collection. It does not take payments, ship products, upload photos, provide live chat push, verify identities, offer password recovery, import old SQLite data, or implement reviews/Google login. A public alias is pseudonymity; messages and photos can still reveal personal information. Use synthetic data for your learning deployment.

## Run locally (Windows, macOS or Linux)

Install Node.js 24.15+ and Docker Desktop with its Linux engine running. From this checkout:

```powershell
node scripts/setup.js
docker compose up --build -d
```

Open **http://localhost:8080**. Create two accounts with different email addresses and passwords of at least 12 characters. Publish an item as the first user, sign out, then make an offer and message the seller as the second user. Sign in as the seller, open **My exchanges**, reply and accept the offer. No real payment occurs.

MongoDB data lives in the `mongo-data` volume. `docker compose down` stops the app and retains data. Do not remove that volume unless intentionally erasing your test data. `.env` contains generated local credentials and must stay private. The MongoDB port and domain services are not published to your network.

For frontend iteration: run `npm ci --ignore-scripts`, then `npm run dev` while Compose is up. Angular’s development server proxies API calls to port 8080.

## Verify

```powershell
npm ci --ignore-scripts
npm run build
npm test
npm run test:integration
npm audit
```

Integration tests start isolated MongoDB and four Node processes, check ownership, input validation, private messaging and concurrent offer acceptance, then stop them. The first run downloads an official MongoDB binary (about 750 MB on Windows). CI also builds both container targets. See [architecture and API](docs/ARCHITECTURE.md).

## Azure for Students

Follow [the complete Azure lab](docs/AZURE.md). It covers container publishing, a managed MongoDB-compatible database, internal service ingress, secret references, scaling, verification, troubleshooting, credit controls and cleanup. No Azure resources are created by cloning this repository. GitHub Pages cannot execute these services.
