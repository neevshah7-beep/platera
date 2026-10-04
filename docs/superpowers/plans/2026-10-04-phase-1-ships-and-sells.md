# Phase 1 — Ships and Sells — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use `- [ ]` tracking.

**Goal:** A launchable storefront for Platera's 925 silver catalogue: computed prices, the
Ledger, cart → Razorpay prepaid checkout → Shiprocket, WhatsApp enquiry, appointments,
owner admin with a ten-second rate screen, policies, SEO and analytics. No WebGL.

**Architecture:** Next.js 15 App Router monolith. Server components render everything
crawlable, including computed prices. A pure, dependency-free pricing module
(`src/lib/pricing`) is the single source of truth, shared by the PDP, cart, checkout,
admin refunds and the Merchant feed. Postgres via Prisma. Stock decrements happen only
inside the payment-confirmation transaction, with a conditional update.

**Tech stack:** Next.js 15, React 19, TypeScript strict, Tailwind 4, Prisma 6 + Postgres 16,
Zod, Vitest, sharp (image derivatives), Razorpay, Shiprocket REST, Resend, Auth (email OTP).

**Spec:** the Master Build Brief v3 (pasted 2026-10-04), as amended by
`docs/CLIENT_DECISIONS.md`. Where they conflict, CLIENT_DECISIONS wins.

## Global constraints
- Money is integer paise everywhere; weights are integer milligrams. No floats in pricing.
- GST 3% on jewellery value, computed on the taxable total, rounded half-up to the paisa.
- Making charge is 10, 15 or 20 (% of metal value), and nothing else.
- No COD. No weight tolerance. No engraving. Made to order is a WhatsApp enquiry only.
- Colours only via CSS custom properties defined once in `src/styles/tokens.css`.
- Fonts: Gambetta (display) and Satoshi (body), self-hosted woff2, `font-display: swap`.
- Banned: ALL-CAPS tracked eyebrows, "→" in button text, urgency copy, countdowns,
  exit popups, glassmorphism, glow, gold gradients-to-black, hover-lift on cards.
- Tabular numerals on every price, weight, purity and measurement.
- CZ is always disclosed as "cubic zirconia (CZ)", never "diamond".
- Every mutation is validated by a shared Zod schema.

---

### Task 1: Scaffold, tokens, fonts, test runner, database
Files: `package.json`, `tsconfig.json`, `next.config.ts`, `src/styles/tokens.css`,
`src/app/globals.css`, `src/app/fonts/*`, `vitest.config.ts`, `docker-compose.yml`, `.env.example`.
Deliverable: `npm run dev` serves a blank onyx page with both fonts; `npm test` runs;
`docker compose up -d db` gives Postgres on :5433.

### Task 2: Pricing engine (TDD)
Files: `src/lib/pricing/{types,compute,refund,format}.ts`, `tests/pricing/*.test.ts`.
Interfaces:
```ts
type MetalKey = 'SILVER_925' | 'GOLD_22K' | 'GOLD_18K' | 'GOLD_14K' | 'PLATINUM_950'
type PriceInput =
  | { mode: 'LIVE'; metal: MetalKey; netWeightMg: number; makingPct: 10|15|20; stonePaise: number; hallmarkPaise: number }
  | { mode: 'FIXED'; pricePaise: number }            // GST-inclusive
interface RateSnapshot { metal: MetalKey; paisePerGram: number; effectiveAt: Date; id: string }
interface Breakdown { lines: Line[]; taxablePaise: number; gstPaise: number; totalPaise: number; rate?: RateSnapshot }
computePrice(input, rate?): Breakdown
computeReturnRefund(args: { input; paidBreakdown: Breakdown; currentRate?: RateSnapshot }): RefundBreakdown
repriceCart(lines: {input; seenTotalPaise}[], rates): { changed: boolean; lines: ... }
```
Tests: metal value arithmetic and rounding · making 10/15/20 · GST 3% · fixed price
GST back-calculation · rate change re-prices · stale cart flags exactly the changed
lines · refund at current rate excludes making and GST · refund capped at the metal
value paid when the rate rises · fixed-price refund = paid − GST.

### Task 3: Prisma schema, migration, seed from inventory
Files: `prisma/schema.prisma`, `prisma/seed.ts`, `src/lib/db.ts`.
Models: Product, ProductImage, Category, Collection, MetalRate, Cart, CartItem, Order,
OrderItem, Customer, Address, Wishlist, Enquiry, Appointment, Review, ServiceRequest,
StockNotification, Coupon, Certificate, AdminUser, OtpCode, Campaign, WebhookEvent.
Deliverable: `npx prisma migrate dev` plus the seed loads 30 draft SKUs and today's rate.

### Task 4: Stock reservation and the one-of-one concurrency test
Files: `src/lib/orders/confirm.ts`, `tests/integration/oversell.test.ts`.
`confirmPaidOrder(orderId, paymentId)` runs in one transaction:
`UPDATE "Product" SET stock = stock - $qty WHERE id=$id AND stock >= $qty`. If zero rows
are affected → the order is marked `PAID_OUT_OF_STOCK` and the auto-refund path is queued.
Test: 20 parallel confirmations against a stock=1 product → exactly 1 succeeds.

### Task 5: Image pipeline
Files: `scripts/process-images.ts`, `public/media/**`, `src/lib/media.ts`.
sharp → AVIF + WebP at 480/960/1600 px + a 20px LQIP data URI, written to a manifest.
The import script enforces `PLT-{CAT}-{SKU}-{nn}` names. CSV template at `assets/import-template.csv`.

### Task 6: Storefront shell, home, collection (the Tray, static), category pages
Files: `src/app/(shop)/**`, `src/components/{site,tray}/**`.

### Task 7: Product page — gallery, Ledger, hallmark, disclosure, actions
Files: `src/app/(shop)/piece/[slug]/page.tsx`, `src/components/ledger/**`, `src/components/pdp/**`.

### Task 8: Cart, checkout, Razorpay (orders, signature verify, idempotent webhook)
Files: `src/lib/cart/**`, `src/app/api/checkout/**`, `src/app/api/webhooks/razorpay/route.ts`.

### Task 9: Admin — auth, rate screen, products, stock, orders, appointments, enquiries
Files: `src/app/admin/**`. Roles: OWNER, STAFF.

### Task 10: Shiprocket — serviceability, shipment on confirm, tracking, /track/[id]

### Task 11: Appointments, WhatsApp enquiry, notifications (email + wa.me fallback)

### Task 12: Policies, trust/visit page, SEO (metadata, JSON-LD, sitemaps, robots), 404/500

### Task 13: Analytics event layer + dictionary; Merchant Center feed

### Task 14: Verification pass — desktop + 390×844 screenshots, a11y, Lighthouse; docs
README, OWNER_GUIDE, SHOOT_GUIDE, BUILD_NOTES, .env.example complete.
