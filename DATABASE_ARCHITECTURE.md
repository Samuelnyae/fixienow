# Fixie — Database Architecture

This document describes how data is structured across the Fixie platform: the entity model,
key relationships, ownership/access rules (Row-Level Security), and design conventions
new entities should follow.

> Fixie is built on Base44's BaaS. Data lives in **entities** (JSON-schema collections). Each
> entity has its own file in `base44/entities/<EntityName>.jsonc`. Every record automatically has
> `id`, `created_date`, `updated_date`, and `created_by_id` — these are **never** declared in the
> schema and are always present.

---

## 1. Design Principles

1. **One entity per business concept.** A `Booking`, a `Ride`, and a `Gig` are all "jobs a
   customer asks for", but they have different lifecycles, fields, and actors — so they stay
   separate. Do not collapse them into a generic "Order".
2. **Denormalize for reads, normalize for money.** Names and labels are copied onto records
   (e.g. `technician_name`, `customer_name`) so list views never need joins. Money and
   authoritative references are **not** denormalized — `technician_id`/`user_id` always points to
   the source of truth, and balances are updated only through their owning entity.
3. **Status enums drive the lifecycle.** Every stateful entity has a `status` field with a fixed
   enum. Transitions are one-directional where possible (e.g. `completed` is terminal).
4. **Object fields for structured, related data.** `location` is `{address, lat, lng}` everywhere
   it appears, so maps and matching share one shape. Arrays are used for tags/lists
   (`skills`, `service_areas`, `evidence_urls`) rather than child entities when the children have
   no independent lifecycle.
5. **Currency is always KES, stored as `number`.** No separate currency entity for local flows;
   `ExchangeRate` exists only for the wallet's multi-currency conversion feature.
6. **RLS is opt-in and explicit.** By default an authenticated app user can read an entity. We add
   `rls` rules only where data must be restricted (wallets, KYC, reviews owned by a user, admin
   tool approval). See §4.

---

## 2. Entity Map (by domain)

### A. Identity & People
| Entity | Purpose | Owned by |
|---|---|---|
| `User` | Built-in platform user. `role` is `admin`/`user`; editable `user_type` marks `technician`/`driver`. | platform |
| `Technician` | Public-facing repair professional profile. | the technician's User |
| `Driver` | Transport driver profile (cab / boda / truck). | the driver's User |
| `UserAddress` | Saved customer addresses (Home/Work/Other). | the customer |
| `FavoriteTechnician` | Customer's saved technicians. | the customer |
| `TechnicianAvailability` | Weekly recurring availability slots + date overrides. | the technician |
| `ServiceArea` | Platform-wide service zones (Nairobi neighborhoods) with base callout fees. | platform (admin) |

### B. Service Marketplace (repairs)
| Entity | Purpose |
|---|---|
| `Booking` | A customer request for a repair technician (instant or scheduled). |
| `ServiceCategory` | Catalog of service categories shown on Home/Services. |
| `Tool` | Marketplace listing for tools/items sold by technicians or the platform. |
| `Review` | Customer rating + comment on a completed booking. |
| `Tip` | Optional gratuity paid after a booking. |
| `Dispute` | Formal complaint raised against a booking. |
| `Refund` | Refund record tied to a booking's payment. |

### C. Transport
| Entity | Purpose |
|---|---|
| `Ride` | A customer transport request (cab / truck / boda), with live SOS + Safe Ride fields. |

### D. Gig Board (reverse job board / same-day gigs)
| Entity | Purpose |
|---|---|
| `Gig` | A short job posted by a customer for technicians to bid on. |
| `GigApplication` | A technician's bid (proposed price + message) on a Gig. |

### E. Wallet & Payments
| Entity | Purpose |
|---|---|
| `Wallet` | A user's internal ledger balance (KES). |
| `Transaction` | Ledger entry (deposit, send, receive, service payment, cashback). |
| `Payment` | Outbound payment for a booking/ride (mpesa/card/cash/wallet). |
| `DepositRequest` | Top-up request (mpesa/card) into the wallet. |
| `WithdrawalRequest` | Cash-out request from wallet to mpesa/bank. |
| `RecurringTransaction` | Scheduled repeating transfer from a wallet. |
| `ExchangeRate` | FX rate snapshot for multi-currency wallet features. |
| `KYCSubmission` | Identity verification documents submitted for wallet upgrade. |

### F. Loyalty
| Entity | Purpose |
|---|---|
| `LoyaltyAccount` | A user's points balance, lifetime points, and tier. |
| `LoyaltyTransaction` | Points earn/redeem/cashback ledger entry. |

### G. Platform & Comms
| Entity | Purpose |
|---|---|
| `Notification` | In-app notification for a user (booking/payment/review/reminder). |
| `ChatMessage` | In-app messages between customer and technician for a booking. |
| `PromoCode` | Discount codes with usage limits and category scoping. |

---

## 3. Key Relationships

### Booking core flow
```
User (customer) ──created_by──> Booking ──technician_id──> Technician ──user_id──> User
                  Booking ──1──> Review ──> Tip
                  Booking ──1──> Dispute ──0/1──> Refund
                  Booking ──0/1──> Payment
                  Booking ──*> ChatMessage (booking_id)
                  Booking.may_use ──> PromoCode (promo_code)
```

### Gig board flow
```
User (customer) ──created_by──> Gig ──*> GigApplication ──technician_id──> Technician
```
A Gig is `open` until the customer accepts one `GigApplication`, then it becomes `matched` and
`matched_technician_id` / `matched_application_id` are set on the Gig.

### Wallet & loyalty
```
User ──1──> Wallet ──*> Transaction
                 ──*> DepositRequest
                 ──*> WithdrawalRequest
                 ──*> RecurringTransaction
User ──1──> LoyaltyAccount ──*> LoyaltyTransaction
KYCSubmission ──user_id──> User, ──wallet_id──> Wallet
```

### Transport
```
User (customer) ──created_by──> Ride ──driver_id──> Driver ──user_id──> User
```
`Ride` carries its own live-tracking fields (`share_token`, `sos_active`) rather than a separate
tracking entity, because the tracking state is a property of the ride, not an independent record.

---

## 4. Row-Level Security (RLS)

RLS is configured per entity under the `rls` key in the entity file. The platform applies rules
server-side; rules use template variables like `user.id` and `user.role`.

**Access tiers used in Fixie:**

| Tier | Entities | Rule shape |
|---|---|---|
| **Public read** | `Technician`, `ServiceArea`, `ServiceCategory`, `Gig` (open), `Tool` (approved), `PromoCode` (active) | `read: {}` — any authenticated user (or guest for browse pages) can read |
| **Owner read/write** | `Wallet`, `Transaction`, `LoyaltyAccount`, `UserAddress`, `FavoriteTechnician`, `Notification`, `ChatMessage`, `KYCSubmission`, `DepositRequest`, `WithdrawalRequest`, `RecurringTransaction` | `read/update/delete: { user_id: user.id }` |
| **Participant read** | `Booking`, `Ride`, `Review`, `Tip`, `Dispute`, `Refund`, `GigApplication` | read allowed for either the customer (`created_by_id` / `user_id`) or the assigned provider (`technician_id` / `driver_id`) |
| **Provider-managed** | `Technician`, `Driver`, `TechnicianAvailability`, `Tool` (own listings) | provider may update records where `user_id === user.id`; platform admin may update all |
| **Admin-only write** | `ServiceArea`, `PromoCode`, `Tool` approval status, `Refund` approval, `Dispute` resolution, `KYCSubmission` status | only `user.role === 'admin'` may create/update/delete; reads may be public or owner |
| **Open create** | `Booking`, `Gig`, `Ride` | `create: {}` — anyone (including guests for bookings) may create; ownership is recorded via `created_by_id` |

**Conventions when adding RLS:**
- Always include **read** rules — a missing read rule leaves records open to every authenticated
  user.
- For "participant" entities, allow **both** sides of the interaction, not just the creator.
- Never grant broad `delete` to non-owners; use status transitions (`cancelled`, `dismissed`)
  instead of hard deletes for business records.
- Admin overrides are expressed with `user.role === 'admin'` conditions, not a separate rule set.

> Detailed rule syntax, operators, and template variables are in the platform RLS guide
> (`get_capability_guide("rls")`). Load it before editing any `rls` block.

---

## 5. Field Conventions

| Pattern | Convention | Example |
|---|---|---|
| Money | `number`, KES, no currency field for local flows | `estimated_price`, `wallet_balance`, `amount` |
| Location | `{ address: string, lat: number, lng: number }` | `Booking.location`, `Ride.pickup`, `Technician.location` |
| Status | `enum` + `default`; terminal states last | `["pending","accepted","en_route","in_progress","completed","cancelled"]` |
| Date | `format: "date"` for calendar days; `format: "date-time"` for timestamps | `scheduled_date`, `needed_by` |
| Time | `string` (HH:mm), no format | `scheduled_time` |
| File / image | `string` URL only — never store file bytes | `profile_photo`, `id_document_url`, `certificate_url`, `image_url` |
| Tag list | `array` of strings | `skills`, `service_areas`, `evidence_urls` |
| Reference | `*_id: string` + a denormalized `*_name` for display | `technician_id` + `technician_name` |
| Enum + default | sensible default so records are usable immediately | `status: { default: "pending" }` |
| Required | only the fields that must exist for the record to be meaningful | Booking requires `category`, `description` |

**Avoid:**
- Storing large content (base64, PDFs, blobs) in a field — upload via `UploadFile` and store the URL.
- Free-text fields where a fixed enum will do.
- Duplicate money fields without a clear semantic (`estimated_price` vs `final_price` is fine;
  `price` + `price2` is not).

---

## 6. Lifecycle Patterns

### Booking lifecycle
`pending → accepted → en_route → in_progress → completed` (or `cancelled` from any pre-`in_progress` state).
On `completed`: a `Payment` is finalized, a `Review` may be created, loyalty points are earned
(via `LoyaltyTransaction`), and the `Technician.wallet_balance` is credited.

### Ride lifecycle
`scheduled → searching → assigned → in_progress → completed` (or `cancelled`).
`share_token` enables the public `RideShare` link; `sos_active` flips the SOS flag for the
shared view.

### Gig lifecycle
`open → matched → completed` (or `cancelled`). Matching is client-side scoring
(`src/lib/gigMatch.js`) — a technician's `GigApplication` carries a `match_score`; the customer
accepts one application, which writes `matched_*` onto the Gig.

### Wallet ledger
Every balance change is one `Transaction` row + one `Wallet.balance` update, never a direct
field write without the ledger entry. Deposits/withdrawals go through `DepositRequest` /
`WithdrawalRequest` (pending → completed) for auditability.

### Verification / KYC
`Technician.verification_status` and `Driver.verification_status` (`pending → approved | rejected`)
gate the "Verified" badge shown to customers. Wallet-level identity upgrade uses `KYCSubmission`
with the same status flow and an admin `reviewed_at`.

---

## 7. Indexing & Query Patterns

Base44 stores entities as queryable collections. Design entities so the common queries are
single-field filters:

| Query | Filter on | Notes |
|---|---|---|
| "My bookings" | `created_by_id: user.id` or `technician_id: tech.id` | sorts by `-created_date` |
| "Available technicians near me" | `is_available: true` + category | proximity computed client-side from `location.lat/lng` |
| "Open gigs I can match" | `status: "open"` + category matching `technician.skills` | see `src/lib/gigMatch.js` |
| "Wallet transactions" | `wallet_id` | chronological |
| "Unread notifications" | `user_id: user.id`, `is_read: false` | sorted newest-first |
| "Admin: pending KYC" | `status: "pending"` | admin-only |

When a query needs to filter by two unrelated fields and performance matters, prefer adding a
denormalized helper field (e.g. `customer_id` on `GigApplication` lets the customer filter their
gigs' applications in one call) over a multi-hop client join.

---

## 8. Adding a New Entity — Checklist

1. Create `base44/entities/<Name>.jsonc` with the full JSON schema (no `id`/`created_date`/
   `updated_date`/`created_by_id` — they're built in).
2. Decide the **access tier** (§4) and add the `rls` block if any restriction is needed.
3. Reuse existing field shapes: `location` object, KES `number` money, `*_id` + `*_name`
   reference pairs.
4. Add a `status` enum with a default if the entity has a lifecycle.
5. Use `file_url` strings for any uploaded document/image — never embed bytes.
6. If it participates in bookings/rides, add the appropriate `*_id` reference and a denormalized
   display field.
7. Seed sample data with `create_entity_records` only **after** the entity file exists.

---

## 9. Migration & Safety Notes

- **Schema changes are additive.** Adding a field or enum value is safe; removing or renaming a
  field that existing records use should be done in two steps (add new → backfill → drop old).
- **Never bulk-delete or bulk-update without a precise filter.** `deleteMany({})` wipes every
  record the caller can reach.
- **Wallet and loyalty writes must keep the ledger and the balance in sync.** Do the
  `Transaction.create` and the `Wallet.update` in the same logical operation; a balance update
  without a ledger row breaks auditability.
- **Production data is live in the preview.** Verification scripts that create records must
  clean up the records they created.

---

## 10. Current Limitations (workspace plan)

- Backend functions (`process_payment`, `submit_review`, `booking_lifecycle`,
  `mpesa_stk_push`, `auto_reassign_bookings`, `resolve_dispute`,
  `check_booking_rate_limit`) are defined but **not accessible** on the current plan; the app
  falls back to direct SDK operations. Upgrading restores them.
- Integration credits (SendEmail, UploadFile, InvokeLLM, etc.) are exhausted until the next
  reset; file-upload-dependent KYC flows are affected until then.