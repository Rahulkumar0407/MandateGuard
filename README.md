# MandateGuard

> **AI reasons. MandateGuard authorizes. Razorpay executes.**

MandateGuard is an AI-powered recurring-commerce protection layer being built
for the Razorpay AI Buildathon — **Track 01: AI Growth & Agentic Commerce**.

This repository is being developed **milestone by milestone**.

## Current Milestone — M0: Razorpay Subscription Skeleton

The goal of M0 is to prove the Razorpay recurring-payment lifecycle **before**
any AI, merchant-offer, or semantic-integrity logic is built:

```
Plan → Subscription → Authentication → Active → Webhook
     → Successful simulated charge → Failed simulated charge
     → Pause → Resume
```

M0 intentionally contains **no AI**, **no merchant offer system**, and **no
Semantic Offer Integrity engine**. Those arrive in later milestones.

## Stack

- **Next.js 16** (App Router) + **TypeScript**
- **PostgreSQL** via **Prisma** (v6)
- **Tailwind CSS**
- **Razorpay Node SDK** (Test Mode) behind a server-side adapter
- Server-side API routes (no client-side Razorpay secret usage)

## Project Structure

```
app/
  api/
    subscriptions/
      route.ts                 # POST: create plan + subscription
      [id]/route.ts            # GET:  subscription state
      [id]/pause/route.ts      # POST: pause
      [id]/resume/route.ts     # POST: resume
    webhooks/razorpay/route.ts # POST: verified, idempotent webhooks
lib/
  env.ts                       # server-only env access
  db.ts                        # Prisma client singleton
  razorpay/
    client.ts                  # Razorpay client (credential-guarded)
    types.ts                   # domain types
    subscriptions.ts           # createPlan/createSubscription/... adapter
    webhooks.ts                # signature verify + dedup key
prisma/
  schema.prisma                # minimal M0 schema
tests/                         # pure-function unit tests (vitest)
```

## Setup

```bash
npm install
cp .env.example .env          # then fill in DATABASE_URL + Razorpay test keys
npx prisma generate
npx prisma migrate dev        # creates the M0 tables
npm run dev
```

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Run unit tests (vitest) |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:studio` | Open Prisma Studio |

## Security notes (Razorpay)

- `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET` are **server-only**.
- Webhook payloads are **signature-verified** and processed **idempotently**.
- Razorpay subscription state is treated as **authoritative**; frontend
  success state is never treated as payment truth.
