# Fixie — Product & Technical Documentation

> Your go-to platform for connecting with certified local technicians for repair services — now with on-demand rides (cab, boda boda, truck), a built-in wallet, AI-powered multi-channel booking, dispute filing, and identity (KYC) verification.

---

## 1. Overview

Fixie is a Kenyan-focused service marketplace that connects customers with verified local technicians (plumbers, electricians, mechanics, etc.) and, more recently, on-demand transport. The platform is built to be mobile-first, works on low-bandwidth connections, and supports booking through multiple channels — in-app, WhatsApp, Telegram, and (planned) USSD/SMS — so even non-tech-savvy users can get help.

**Who it's for**
- **Customers** — anyone needing a repair or a ride.
- **Technicians** — certified pros who list services, set rates, manage availability, and earn through the platform.
- **Admins** — verify technicians, approve tool listings, manage KYC, resolve disputes, and oversee operations.

---

## 2. Core Features

### 2.1 Service Marketplace
- Browse services by category (mechanic, plumber, electrician, carpenter, painter, HVAC, appliance repair, locksmith).
- Search and filter technicians by category, availability, price, rating, and favorite status.
- Technician detail profiles with bio, skills, ratings, reviews, service areas, and contact options.
- Interactive Leaflet map of nearby available technicians, filterable by service area.
- Favorite technicians for quick re-booking.

### 2.2 Booking Flow
- Multi-step booking: choose service → describe problem → pick instant or scheduled → set area & address → AI dispatch matches the best technician → confirm.
- **AI dispatch** ranks available verified technicians by rating, reviews, experience, and area match.
- Promo code support (percentage or fixed discount, per-user limits, category restrictions, validity windows).
- Booking lifecycle: `pending → accepted → en_route → in_progress → completed → cancelled`.
- Live technician tracking map on the booking detail page.
- In-booking chat between customer and technician (ChatMessage entity, realtime subscriptions).
- Dispute filing with evidence uploads (Dispute entity).
- Tips to technicians after completion (Tip entity).
- Reviews and ratings after completion (Review entity).

### 2.3 Ride Ordering (Fixie Rides — Bolt-style)
- Order a **cab**, **boda boda**, or **truck** on demand.
- Pickup + destination inputs with geolocation support and offline Nairobi-area geocoding.
- Upfront fare estimate (base + per-km + per-min) using Haversine distance.
- Live Leaflet map with pickup, destination, route line, and a moving driver marker.
- Lifecycle: `searching → assigned → in_progress → completed → cancelled`, each state persisted to the **Ride** entity.
- Post-trip rating.
- Bolt-inspired UI: map-first layout, dark primary action buttons, lime-green accents.

### 2.4 Wallet
- Internal ledger wallet per user (Wallet entity) with multi-currency balances.
- Send money, deposit, withdraw, exchange, and recurring transactions.
- Transaction history with filters (type, currency, status, date, sort).
- **KYC gate**: wallet actions (send, deposit, withdraw, transactions) are locked until the user submits identity verification (KYCSubmission entity). The balance card and KYC form remain visible.
- Recurring transaction scheduling (daily/weekly/biweekly/monthly/yearly).
- Exchange rate reference (ExchangeRate entity).

### 2.5 KYC / Identity Verification
- KYCSubmission entity captures ID type, ID number, full name, DOB, front/back ID images, selfie, and proof of address.
- Wallet access is gated until a submission exists (pending or approved). Rejected submissions re-lock the wallet.
- ⚠️ **Admin approval UI for KYC is not yet built** — see Production Roadmap.

### 2.6 AI Booking Agent (multi-channel)
- An in-app AI agent (`fixie_booking_agent`) handles both **repair bookings** and **ride orders** through natural conversation.
- Channels: in-app chat, WhatsApp, Telegram (USSD/SMS planned).
- The agent reads Technician/ServiceArea records, creates Booking/Ride/Notification records, and confirms to the customer.
- Swahili-friendly tone; collects info one question at a time.
- Floating "Book via WhatsApp" button across the app.

### 2.7 Tools Marketplace
- Technicians (and admins) can list tools/parts for sale (Tool entity).
- Tool cards with images, brand, condition, price, stock, ratings.
- Cart drawer and checkout flow.
- Admin approval of tool listings (`pending → approved → sold`).

### 2.8 Technician Experience
- Dedicated dashboard, jobs board, earnings summary, and profile.
- AI suggestions panel to help technicians respond to jobs.
- WhatsApp & Telegram contact buttons.
- Availability scheduling (TechnicianAvailability entity, recurring weekly slots + date overrides).
- Earnings balance and withdrawal requests.

### 2.9 Admin Dashboard
- Skewed neomorphism UI style.
- 2×2 stat grid (users, pending requests, bookings, revenue).
- Tabs: pending approvals, bookings, technicians, tool management.
- Approve/reject technician verification.
- Tool listing management (AdminToolsManager).
- Service area management.
- Fraud detection panel (FraudDetection page with alerts/scan).

### 2.10 Notifications
- In-app notification bell with unread badges.
- Notification entity for booking events, payments, reviews.
- NotificationCenter page.

---

## 3. How It Works (User Journeys)

### Customer books a repair
1. Opens Home, searches or browses categories.
2. Picks a technician (or lets the AI match one) → Book Service.
3. Describes the problem, chooses instant/scheduled, enters area & address.
4. AI dispatch picks the best verified, available technician.
5. Booking created (`pending`); technician notified in-app.
6. Technician accepts → `en_route` → `in_progress` → `completed`.
7. Customer pays, optionally tips, and leaves a review.

### Customer orders a ride
1. Opens **Get a ride** (from Home or `/OrderRide`).
2. Sets pickup (type an area or "use my location") and destination.
3. Picks cab / boda boda / truck with upfront fare.
4. Requests → Ride created (`searching`) → driver matched (`assigned`) → on trip (`in_progress`) → completed.
5. Pays (cash/M-Pesa/wallet) and rates the trip.

### Technician onboards
1. Registers via the multi-step wizard (profile, skills, docs, service areas).
2. Admin verifies → `verification_status: approved`.
3. Technician sets availability, rates, and starts receiving jobs.
4. Earns into wallet balance; can list tools for sale.

### Wallet user verifies identity
1. Opens Wallet → sees balance + KYC gate.
2. Submits KYC (ID, selfie, address proof).
3. Once submitted (pending/approved), wallet actions unlock.
4. Can send/deposit/withdraw/exchange and view transactions.

---

## 4. Architecture & Tech Stack

- **Frontend**: React 18 + Vite, Tailwind CSS, shadcn/ui (Radix), lucide-react icons.
- **Routing**: react-router-dom (SPA). `src/App.jsx` is the router; `src/pages.config.js` holds legacy pages; new routes are added explicitly in `App.jsx`.
- **Layout**: `src/Layout.jsx` — top header + bottom mobile nav, public browsing (no auth gate), role-aware nav (customer vs technician vs admin).
- **Maps**: react-leaflet + OpenStreetMap tiles. Offline Nairobi-area geocoder in `src/lib/kenyaAreas.js`.
- **Data/API**: Base44 BaaS — entities, auth, integrations, agents, workflows via the pre-initialized SDK (`@/api/base44Client`).
- **State/data fetching**: TanStack React Query for server state; React hooks for UI state.
- **Forms**: react-hook-form + zod; shadcn form components.
- **AI agent**: Base44 in-app agent (`base44/agents/fixie_booking_agent.jsonc`) with entity tool permissions and multi-channel greetings.
- **Payments (planned)**: M-Pesa via Daraja (STK push), card via Stripe (packages installed), internal wallet ledger.
- **PDF**: jsPDF + html2canvas for receipts/invoices.

### Key data entities
Booking, Ride, Technician, TechnicianAvailability, ServiceArea, ServiceCategory, UserAddress, Review, Tip, Dispute, ChatMessage, Notification, FavoriteTechnician, PromoCode, Tool, Wallet, Transaction, DepositRequest, WithdrawalRequest, Refund, RecurringTransaction, ExchangeRate, KYCSubmission, Payment, FraudAlert.

---

## 5. Current Limitations (read before testing)

These are **platform/plan limitations**, not app bugs:

1. **Integration credits exhausted** (resets 2026-09-01). Until reset or upgrade:
   - File uploads (KYC documents, tool images) are blocked.
   - AI dispatch LLM call, SendEmail, GenerateImage/Video, TranscribeAudio are blocked.
   - In-app agent automations are blocked.
2. **Backend functions need Builder+** to run/modify. Existing functions (`process_payment`, `submit_review`, `booking_lifecycle`, `mpesa_stk_push`, `auto_reassign_bookings`, `resolve_dispute`, `check_booking_rate_limit`) are present but not accessible on the current plan. The app falls back to direct SDK operations where possible.
3. **Ride dispatch is simulated client-side** (driver names, plates, ETA timers). No real driver fleet or live matching backend yet.
4. **KYC has no admin approval screen** — submissions are saved but nothing flips them to approved; the wallet currently unlocks on "submitted (pending)" as a pragmatic interim.
5. **SMS/USSD booking** is gated behind an external SMS gateway (Africa's Talking) + Builder+.
6. **Payments are simulated** (internal ledger). No live M-Pesa/Stripe wired yet.

---

## 6. Production Roadmap — What's Needed to Go to Society

### 6.1 Unblock the platform (do first)
- Upgrade to **Builder+** to regain backend functions and integration credits.
- Ensure integration credits for uploads, LLM, and email.

### 6.2 Real payments
- Wire `mpesa_stk_push` to live Safaricom Daraja (Consumer Key/Secret, shortcode, passkey) via app secrets.
- Wire `process_payment` for deposit→wallet and wallet→technician payouts.
- Reconcile the internal ledger against M-Pesa callbacks (C2B confirmation + validation).
- Add card payments via Stripe (packages already installed) for web users.

### 6.3 KYC that actually verifies
- Build an **admin KYC review screen** in AdminDashboard (list pending KYCSubmission records, approve/reject with reason).
- Flip the wallet gate to require `status === 'approved'`.
- Integrate a verification provider (Smile ID / Africa's Talking KYC) for ID-vs-selfie liveness checks.
- Store documents in private storage with signed URLs (UploadPrivateFile + CreateFileSignedUrl).

### 6.4 Real ride fleet & dispatch
- Create a **Driver** entity + driver onboarding/verification (mirror technician flow).
- Driver app role + "go online" toggle and live location pings.
- Server-side dispatch: nearest available driver by Haversine, auto-assign, push notifications.
- Real fare calculation, surge pricing, and trip routing (OSRM/Google Directions) instead of straight-line Haversine.
- Driver payouts to wallet; commission to platform.

### 6.5 Notifications that reach users
- SMS via Africa's Talking for booking confirmations, ride status, reminders.
- Email receipts via SendEmail (registered users).
- Push notifications (PWA / mobile build) for ride and booking updates.

### 6.6 Trust, safety & legal
- Terms of Service, Privacy Policy, Refund & Dispute policy pages.
- Surface **FileDisputeDialog** from BookingDetail/MyBookings for customers.
- Background checks / vetting SLA for technicians and drivers.
- Insurance consideration for rides (passenger safety).
- Data protection compliance (Kenya DPA 2019): consent, retention, access/delete requests.

### 6.7 Operational density
- Recruit and vet a first cohort of technicians and drivers per category/area.
- Seed ratings/reviews so early customers see credible profiles.
- Set admin approval SLAs (how fast a new technician/driver is verified).

### 6.8 Growth & retention
- Surface PromoCode in the booking flow (built — keep iterating).
- Referral program (invite codes, first-ride/first-job credits).
- Rebook flow from completed bookings/rides.
- Loyalty tiers for frequent customers.

### 6.9 Reliability & observability
- Analytics events already wired (`base44.analytics.track`) — add funnel dashboards (bookings/day, rides/day, revenue, technician/driver activation, KYC backlog).
- Error monitoring (Sentry connector available).
- Uptime and rate-limit guardrails (`check_booking_rate_limit` once backend is back).
- Backups and data export for compliance.

### 6.10 Mobile apps
- The same React codebase publishes to iOS/Android — design responsively and build/install the mobile wrappers before public launch.
- Add PWA install prompts and offline-tolerant screens.

### 6.11 Accessibility & localization
- Swahili localization (strings already use Swahili in the agent; extend to UI).
- RTL/keyboard/screen-reader pass for forms and the map.
- Low-bandwidth mode (lighter map tiles, fewer images).

---

## 7. Deployment & Operations

- **Hosting**: Base44-managed; publish from the builder when ready.
- **Custom domain**: configure in app settings; `vercel.json` already has SPA rewrite rules for client-side routing.
- **Secrets**: set via app secrets (M-Pesa keys, Stripe keys, SMS gateway) — never hardcode.
- **Environments**: use a staging app for testing payment/driver flows before production.
- **Backups**: export entity data periodically (entity list/filter via SDK).

---

## 8. Getting Started (for developers)

1. The app runs on Base44 — open the builder to preview/publish.
2. Routes live in `src/App.jsx`; pages in `src/pages/`; shared components in `src/components/`.
3. Entities are JSON schemas in `base44/entities/*.jsonc`.
4. The AI agent config is `base44/agents/fixie_booking_agent.jsonc`.
5. Backend functions live in `base44/functions/*/entry.ts` (require Builder+ to edit/run).
6. Offline geocoder: `src/lib/kenyaAreas.js`. Ride config & pricing: `src/lib/rideConfig.js`.
7. Theme tokens: `src/index.css` (HSL CSS variables) mapped in `tailwind.config.js`.

### Brand
- Primary teal: `#0B463C` (dark) / `#197B6B` (light).
- Accent (rides): `#9CE11F` lime-green.
- WhatsApp: `#25D366` · Telegram: `#0088cc`.

---

## 9. Glossary
- **KYC** — Know Your Customer; identity verification required to unlock wallet features.
- **Boda boda** — motorcycle taxi, common in East Africa.
- **STK push** — M-Pesa USSD prompt sent to a customer's phone to approve a payment.
- **Daraja** — Safaricom's M-Pesa developer API.
- **Ledger** — internal record of wallet balances and transactions (simulated for now).

---

*Fixie — Expert help, right when you need it. And now, a ride too.*