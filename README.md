# ReplySync

ReplySync is a secure, multi-tenant WhatsApp Automation and CRM platform. Built to abstract the complexity of Meta's Developer Cloud into an aggressively robust React front-end, it connects incoming WhatsApp conversations synchronously into your local database, allowing local supervisors to resolve leads or fire off AI replies driven organically via **Groq** (LLama-3).

---

## 🚀 Key Features

* **Multi-Tenant Architecture:** Fully walled-off environments. Every logged-in supervisor only ever reads/writes threads tied natively to their own verified authenticated tokens.
* **Instant Auto-Reply (AI):** Using Meta's webhook polling mapped straight into Groq, incoming WhatsApp traffic is passed to the AI containing your specific FAQ matrix. It answers instantly. 
* **Lead Kanban Pipelines:** Clean, inline-editable UI lists categorizing fresh leads mapped directly out of phone calls into actionable states (`Contacted`, `Enrolled`, `Lost`).
* **Real-time Engine:** Fully active Supabase `postgres_changes` socket websockets. Replies incoming from Meta drop into your dashboard organically without reloading.

---

## ⚙️ Initial Setup Guide

### 1. Supabase Initialization
1. Spin up a new blank project on [Supabase](https://supabase.com).
2. Go to the SQL Editor and strictly run the entire `/lib/schema.sql` code block to instantly bootstrap all Tables, RLS Policies, and RPC Triggers!
3. Obtain your `Project URL` and `Anon Public Key`.

### 2. Vercel & Environments
Clone this repository and inject the `.env.local` mappings (or put them in your Vercel Project):
| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public Anon Supabase Key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service Role Key (from Supabase → Settings → API). **Never expose to client.** |
| `NEXT_PUBLIC_APP_URL` | The fully qualified URL of your frontend |
| `GROQ_API_KEY` | Free API key from `console.groq.com` |
| `INTERNAL_API_SECRET` | Random secret string — secures internal API calls between webhook → AI reply |
| `CRON_SECRET` | Random secret string — authenticates Vercel Cron requests |
| `NEXT_PUBLIC_META_VERIFY_TOKEN` | A simple string you choose for Meta webhook verification |

### 3. Deploy
Push to Vercel!
*(Note: Because we provided `vercel.json`, your instance will automatically trigger the `api/cron/followup` endpoint natively for free!)*

---

## 📱 Meta Webhook (Client Side Setup)

When you onboard a new business locally, they just hit your **Settings** Panel:
1. Create a [Meta Developer Account](https://developers.facebook.com).
2. Create an App ➔ Add the **WhatsApp** Product constraint.
3. Hook the Webhook URL the platform generates inside Settings (e.g. `https://yourdomain.com/api/webhook`).
4. Drop their generated `Phone Number ID` and `Access Token` natively into ReplySync! 

The system takes absolute control from there!
