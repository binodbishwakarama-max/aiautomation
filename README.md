# ReplySync

ReplySync is a multi-tenant WhatsApp automation and CRM app built with Next.js and Supabase.

This branch includes a SaaS hardening pass focused on:

- encrypted tenant secrets at rest
- signed Meta webhook verification
- webhook idempotency by provider message ID
- template-based follow-ups after the 24-hour service window
- resilient signup/reset-password flows
- workspace switching and role-aware UI
- audit logs, usage metering, billing/seat scaffolding, and tests

## Setup

### 1. Database

For a fresh project, run [`lib/schema.sql`](./lib/schema.sql).

For an existing project based on the older schema, run [`lib/migrations/20260418_saas_hardening.sql`](./lib/migrations/20260418_saas_hardening.sql) and then re-enter each tenant's WhatsApp access token and Meta app secret from the Settings page.

### 2. Environment Variables

Set these in `.env.local` or in your hosting platform:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `APP_ENCRYPTION_KEY` | Required. Used to encrypt tenant secrets before storing them |
| `GROQ_API_KEY` | Groq API key |
| `CRON_SECRET` | Protects the follow-up cron endpoint |
| `META_VERIFY_TOKEN` | Server-side webhook verify token |
| `NEXT_PUBLIC_META_VERIFY_TOKEN` | Same value as `META_VERIFY_TOKEN`, exposed only so the UI can display setup instructions |

### 3. WhatsApp Tenant Setup

Each workspace now needs three values for a secure integration:

1. `Phone Number ID`
2. `Access Token`
3. `Meta App Secret`

The app secret is required so `/api/webhook` can validate the `x-hub-signature-256` signature before processing messages.

### 4. Follow-ups

Follow-up messages are now sent as approved WhatsApp templates, not free-form text. Configure:

- template name
- language code
- optional template variables

in the Settings screen.

## Auth Flow

- Signup stores the intended business name in auth metadata.
- Workspace creation is completed after the user has a valid authenticated session.
- Email verification and password reset both use `/auth/callback`.

## Scripts

```bash
npm run dev
npm run lint
npm run typecheck
npm run test
npm run build
```

## Notes

- Agents can work leads and conversations, but workspace-level configuration is restricted to owners/admins.
- Secrets are masked in the browser and only rotated through server routes.
- Manual human takeover replies now send through a server-controlled endpoint and are audited.
