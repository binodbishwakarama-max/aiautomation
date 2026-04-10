import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Admin client bypasses RLS — use ONLY in server-side API routes (webhook, ai-reply, cron).
// NEVER import this in client components or expose to the browser.
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
