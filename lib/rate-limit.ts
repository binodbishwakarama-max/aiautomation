import { supabaseAdmin } from '@/lib/supabase-admin';
import { logger } from '@/lib/logger';

/**
 * Supabase-backed rate limiter.
 *
 * Uses a `rate_limit_entries` table instead of an in-memory Map so it
 * survives serverless cold starts and works across replicas.
 *
 * Falls back to an in-memory Map if the database call fails, so the
 * app degrades gracefully rather than crashing.
 */

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
};

// In-memory fallback (used when DB is unavailable)
const memoryStore = new Map<string, { count: number; resetAt: number }>();

function memoryFallback(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const entry = memoryStore.get(key);

  if (!entry || entry.resetAt <= now) {
    memoryStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterMs: windowMs };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, retryAfterMs: Math.max(entry.resetAt - now, 0) };
  }

  entry.count += 1;
  return { allowed: true, remaining: Math.max(limit - entry.count, 0), retryAfterMs: Math.max(entry.resetAt - now, 0) };
}

export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  try {
    const now = new Date();
    const windowStart = new Date(now.getTime() - windowMs);

    // Clean up expired entries for this key
    await supabaseAdmin
      .from('rate_limit_entries')
      .delete()
      .eq('key', key)
      .lt('created_at', windowStart.toISOString());

    // Count existing entries within the window
    const { count, error: countError } = await supabaseAdmin
      .from('rate_limit_entries')
      .select('*', { count: 'exact', head: true })
      .eq('key', key)
      .gte('created_at', windowStart.toISOString());

    if (countError) {
      throw countError;
    }

    const currentCount = count || 0;

    if (currentCount >= limit) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterMs: windowMs,
      };
    }

    // Insert a new entry
    const { error: insertError } = await supabaseAdmin
      .from('rate_limit_entries')
      .insert({ key, created_at: now.toISOString() });

    if (insertError) {
      throw insertError;
    }

    return {
      allowed: true,
      remaining: Math.max(limit - currentCount - 1, 0),
      retryAfterMs: windowMs,
    };
  } catch (error) {
    // If the rate_limit_entries table doesn't exist or DB fails, fall back to memory
    logger.warn('Rate limit DB check failed, using memory fallback', {
      key,
      error: error instanceof Error ? error.message : String(error),
    });
    return memoryFallback(key, limit, windowMs);
  }
}
