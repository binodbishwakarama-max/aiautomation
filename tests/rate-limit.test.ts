import { describe, expect, it, vi } from "vitest";

vi.mock("../lib/supabase-admin", () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      gte: vi.fn().mockResolvedValue({ count: null, error: new Error('db error') }),
    })),
  },
}));

vi.mock("../lib/logger", () => ({
  logger: {
    warn: vi.fn(),
  },
}));

import { checkRateLimit } from "../lib/rate-limit";

describe("rate limit helper", () => {
  it("allows requests until the limit is reached (using memory fallback)", async () => {
    const key = `rate-limit-${Date.now()}`;

    expect((await checkRateLimit(key, 2, 60_000)).allowed).toBe(true);
    expect((await checkRateLimit(key, 2, 60_000)).allowed).toBe(true);
    expect((await checkRateLimit(key, 2, 60_000)).allowed).toBe(false);
  });
});
