import { describe, expect, it, vi } from 'vitest';

describe('Lazy Proxy Clients', () => {
  it('should defer supabaseAdmin initialization until property access', async () => {
    const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const originalKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Importing module when env vars are missing should NOT throw
    const { supabaseAdmin } = await import('@/lib/supabase-admin');

    expect(supabaseAdmin).toBeDefined();

    // Invoking a property method when env vars are missing SHOULD throw a clear error
    expect(() => supabaseAdmin.from('test')).toThrowError(/Supabase environment variables/);

    // Restore env vars
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl || 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = originalKey || 'test-service-key';
  });

  it('should defer groq initialization until property access', async () => {
    const { groq } = await import('@/lib/groq');
    expect(groq).toBeDefined();
    expect(typeof groq.chat).toBe('object');
  });
});
