# Fixie — Project Proposal

**Project title:** Fixie — A mobile platform connecting communities with certified local technicians and on-demand transport
**Country / region of implementation:** Kenya (pilot: Nairobi — Westlands, Kilimani, Kasarani, Embakasi, CBD)
**Project duration:** 12 months (Phase 1 pilot: Months 1–6; Scale: Months 7–12)
**Date prepared:** August 2026

---

## 1. Project Idea

Fixie is a mobile-first marketplace that links households and small businesses with **verified, vetted local technicians** (plumbers, electricians, mechanics, carpenters, painters, HVAC, appliance repair, locksmiths) and **on-demand transport** (cab, boda boda, and truck). It converts fragmented, word-of-mouth informal services into a trustworthy digital economy where providers earn dignified, documented income and customers get safe, rated service at fair, transparent prices.

The platform has four integrated pillars:
1. **Repair marketplace** — book a vetted technician by category, area, price, and rating, with instant or scheduled booking, live technician tracking, in-app chat, and post-service reviews.
2. **Ride-hailing** — a Bolt-style transport module for cabs, boda bodas, and trucks, with fare estimation, live driver maps, and cash/M-Pesa/wallet payment.
3. **Digital wallet** — a KYC-gated internal ledger enabling deposits, transfers, withdrawals, recurring payments, and multi-currency exchange; providers are paid into the wallet after completed jobs.
4. **Tools marketplace** — technicians and the platform list and sell tools/spares, creating an additional income stream and a one-stop repair ecosystem.

Booking is deliberately **multi-channel**: a smartphone app, an in-app AI booking assistant, WhatsApp and Telegram agents, and USSD — so low-data and feature-phone users are not excluded.

---

## 2. Problem Addressed

Kenya's informal repair and transport sectors employ millions of youth but remain disorganised and opaque:

- **Unreliable trust:** Customers hire unknown handymen through word-of-mouth with no verified identity, qualifications, or ratings, exposing homes and families to fraud, poor workmanship, and safety risks.
- **Idle capacity & underemployment:** Skilled youth wait hours for referrals; without a digital footprint, they cannot build reputation, access credit, or grow a customer base beyond their neighbourhood.
- **Unsafe, unregulated transport:** Boda boda and informal cab riders face unclear pricing, unvetted drivers, and no accountability; women and youth are especially vulnerable.
- **Financial exclusion:** Most providers are unbanked or underbanked, paid in cash with no transaction history — locking them out of credit, savings, and insurance.
- **Digital divide:** Existing gig platforms assume smartphones and data, excluding large segments of the population.

Fixie addresses all five gaps by combining vetting, transparent pricing, a digital wallet, and low-bandwidth booking channels.

---

## 3. Proposed Activities

**Activity 1 — Provider onboarding & vetting (Months 1–4)**
Recruit 300 technicians and 150 drivers through partnerships with youth groups, technical colleges (NVTI, KIUMA), boda boda SACCOs, and CBOs. Run mobile registration clinics; verify national ID, trade certificates, driving licences, and vehicle insurance; admin approval in the Drivers/Technicians admin panels.

**Activity 2 — Platform rollout & customer acquisition (Months 2–6)**
Launch the app and WhatsApp/USSD booking. Run community demos in estates and markets, partner with estate associations and small businesses, and run a referral programme (KES 100 wallet credit per successful referral). Target 5,000 active customers in the pilot.

**Activity 3 — Financial inclusion & KYC (Months 3–6)**
Onboard providers to the Fixie wallet with KYC (ID + selfie + proof of address). Enable M-Pesa deposits/withdrawals, wallet-to-wallet transfers, and recurring rent/utility payments. Partner with a licensed payment provider for compliant rails.

**Activity 4 — Capacity building (Months 3–9)**
Run monthly skill-up sessions: digital profile management, pricing & negotiation, customer service, basic bookkeeping, and safety/first-aid for drivers. Issue digital completion badges on profiles.

**Activity 5 — Dispute & quality assurance (Months 2–12)**
Operate an in-app dispute filing and resolution workflow, an AI fraud-detection panel, and a customer rating system. Maintain a 4.0+ average rating threshold; suspend providers below threshold after warnings.

**Activity 6 — Monitoring, evaluation & reporting (ongoing)**
Quarterly surveys with partner CBOs, monthly KPI dashboards, and a midline (Month 6) and endline (Month 12) evaluation.

---

## 4. Implementation Approach

**Technology stack:** A cloud-hosted, mobile-responsive web app (publishable to iOS/Android) built on the Base44 platform with React, Tailwind, a managed database, and serverless backend functions. Core modules: entities for technicians, drivers, bookings, rides, wallets, KYC, reviews, disputes, tools, and notifications; backend functions for payment processing, booking lifecycle, M-Pesa STK push, auto-reassignment, dispute resolution, and rate-limiting.

**Partnerships:** Technical training institutions (recruitment + skills), boda boda SACCOs and taxi associations (drivers), licensed M-Pesa payment providers (payments), CBOs and youth groups (community mobilisation), and county government trade offices (vetting support and permits).

**Governance:** Admin dashboard for provider approval, fraud monitoring, dispute resolution, and payouts. KYC mandatory before wallet activation. Data protection compliant with Kenya's Data Protection Act (2019).

**Inclusivity:** USSD and WhatsApp/Telegram agents ensure feature-phone access; service-area free-text and lenient matching so providers in informal settlements are discoverable; gender-sensitive safety features (verified drivers, trip sharing, SOS).

**Phasing:** Pilot in 5 Nairobi sub-counties (Months 1–6) to validate unit economics and retention, then scale to 3 additional counties (Nakuru, Mombasa, Kisumu) in Months 7–12.

---

## 5. Expected Outcomes

**Provider outcomes**
- 450 youth (300 technicians + 150 drivers) onboarded and verified by Month 12.
- Average provider monthly income uplift of **35–60%** vs. baseline (target measured at baseline survey).
- 70% of providers actively using the wallet with KYC by Month 12.
- Digital work history enabling at least 200 providers to access a first formal credit/insurance product.

**Customer outcomes**
- 5,000+ active customers in pilot; 20,000+ by Month 12.
- 90% of completed bookings rated 4★ and above.
- Reduced time-to-find-a-technician from days/hours to under 15 minutes.

**System outcomes**
- 15,000+ completed bookings and rides by Month 12.
- A documented, rated, accountable local services network in pilot counties.
- A replicable, open model for other Kenyan counties and East African markets.

**Learning outcomes:** Participating youth will be able to build and manage a digital professional profile, price and negotiate work, use a digital wallet and basic financial records, deliver rated service that builds reputation, and access customers beyond their neighbourhood.

---

## 6. Budget (KES)

| Category | Description | Months 1–6 | Months 7–12 | Total (KES) |
|---|---|---:|---:|---:|
| Platform & hosting | Cloud hosting, domains, SSL, SMS/USSD gateway | 180,000 | 220,000 | **400,000** |
| Payments integration | M-Pesa Daraja onboarding & transaction fees subsidy | 120,000 | 180,000 | **300,000** |
| Provider onboarding | Registration clinics, KYC verification, document checks | 200,000 | 150,000 | **350,000** |
| Community mobilisation | CBO partnerships, estate demos, referral credits | 250,000 | 300,000 | **550,000** |
| Capacity building | Training venues, facilitators, materials, safety kits | 220,000 | 280,000 | **500,000** |
| Marketing & awareness | Radio, social, flyers, signage | 300,000 | 400,000 | **700,000** |
| M&E & research | Baseline, midline, endline surveys, data analysis | 150,000 | 150,000 | **300,000** |
| Personnel | Project lead, operations, tech support, community officers (4 FTE) | 900,000 | 1,100,000 | **2,000,000** |
| Equipment | Tablets/phones for field staff, driver reflectors/helmets | 180,000 | 120,000 | **300,000** |
| Contingency (~10%) | | 130,000 | 170,000 | **300,000** |
| **TOTAL** | | | | **5,700,000** |

*Indicative; to be refined with co-funding partners. In-kind contributions from partners (venues, SACCO mobilisation) valued separately.*

---

## 7. Sustainability Plan

**Revenue model (cost recovery + growth):**
- 10–15% service fee on completed bookings and rides (transparently shown).
- Small listing/boost fee for the tools marketplace.
- Optional premium provider subscription (verified badge priority, advanced analytics).
- Wallet float and transaction fees via licensed payment partner.

**Provider retention:** Daily payouts to wallet, transparent ratings, skill-up badges, and access to credit/insurance — making Fixie providers' primary income channel.

**Community ownership:** Partner CBOs and SACCOs co-manage onboarding and vetting in each county, embedding the project locally and reducing centralised cost.

**Scalability:** The architecture is cloud-native and entity-driven, so adding counties requires configuration, not rebuilds. The model is designed to replicate across East Africa.

**Risk management:** KYC + admin vetting reduce fraud; the dispute and AI fraud-detection modules protect users; diversified revenue avoids dependence on a single stream; phased expansion validates unit economics before scaling.

**Exit/succession:** By Month 18, Fixie operations in pilot counties are intended to be self-sustaining from transaction revenue, with a local operations team and partner-managed provider networks — reducing reliance on grant funding.

---

**Alignment with Sustainable Development Goals:** SDG 1 (No Poverty), SDG 8 (Decent Work & Economic Growth), SDG 9 (Industry, Innovation & Infrastructure), SDG 11 (Sustainable Cities & Communities).

*Prepared by the Fixie project team — August 2026.*