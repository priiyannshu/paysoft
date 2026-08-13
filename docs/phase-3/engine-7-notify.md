# Engine 7: Notification & Dispatch Engine

## Work Directive
**Phase Branch:** `layer/02-backend`  
**Feature Branch:** `feat/engine-7-notify`  

**Instructions:**
1. Switch to the phase branch: `git checkout layer/02-backend`
2. Create and switch to your feature branch: `git checkout -b feat/engine-7-notify`
3. Implement the engine as specified below.
4. Once tests pass, merge `feat/engine-7-notify` back into `layer/02-backend` and delete the feature branch.

---

## Master Plan Context
A `Notifier` interface in `app/cf-worker/engines/7-notify/` with one implementation: **Cloudflare Email Service** via the `send_email` binding (`wrangler email sending enable <domain>` — needs the domain decision; without a domain, a `LogNotifier` writes to `audit_logs` so the engine is complete and swappable). WhatsApp/SMS are post-launch implementations of the same interface — do not build them now.

---

## Blueprint Specification
- **Input:** Event trigger (payroll finalized, payslip generated, compliance deadline approaching).
- **Process:** Enqueue notification via Cloudflare Queues. Worker picks up queue message and dispatches via:
  - **Email:** Cloudflare Email Service API with PDF attachment (or Resend API).
  - **WhatsApp:** Business API for salary credit alerts. (Post-launch)
  - **SMS:** Optional for critical alerts. (Post-launch)
- **Output:** Delivery confirmation.
- **Endpoints:** `POST /notify/dispatch` (internal, triggered by Engine 4/6 events).
