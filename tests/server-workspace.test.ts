import { describe, expect, it, vi } from "vitest";

// Mock supabase-admin
vi.mock("../lib/supabase-admin", () => ({
  supabaseAdmin: {
    from: vi.fn(),
  },
}));

// Mock supabase/server
vi.mock("../lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "user-1", user_metadata: { business_name: "My Biz" } } },
        error: null,
      }),
    },
  })),
}));

// Mock crypto
vi.mock("../lib/crypto", () => ({
  decryptSecret: vi.fn((v: string) => (v ? `decrypted-${v}` : null)),
  encryptSecret: vi.fn((v: string) => `encrypted-${v}`),
  last4: vi.fn((v: string) => (v ? v.slice(-4) : null)),
}));

import { supabaseAdmin } from "../lib/supabase-admin";

describe("server-workspace helpers", () => {
  function setupAdminMock(responses: Record<string, unknown>) {
    const fromMock = supabaseAdmin.from as ReturnType<typeof vi.fn>;
    fromMock.mockImplementation((table: string) => {
      const makeChain = (): Record<string, unknown> => {
        const c: Record<string, unknown> = {
          select: vi.fn(() => c),
          eq: vi.fn(() => c),
          order: vi.fn(() => c),
          limit: vi.fn(() => c),
          single: vi.fn().mockResolvedValue(responses[`${table}.single`] || { data: null, error: null }),
          maybeSingle: vi.fn().mockResolvedValue(responses[`${table}.maybeSingle`] || { data: null, error: null }),
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue(responses[`${table}.insert`] || { data: { id: "new-id" }, error: null }),
            })),
          })),
          upsert: vi.fn().mockResolvedValue({ error: null }),
          update: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) })),
        };
        return c;
      };
      return makeChain();
    });
  }

  it("ensureWorkspaceForUser creates a workspace when none exists", async () => {
    setupAdminMock({
      "business_users.maybeSingle": { data: null, error: null },
      "businesses.insert": { data: { id: "biz-new" }, error: null },
    });

    const { ensureWorkspaceForUser } = await import("../lib/server-workspace");
    const result = await ensureWorkspaceForUser({
      id: "user-1",
      user_metadata: { business_name: "Test" },
    } as unknown as Parameters<typeof ensureWorkspaceForUser>[0]);

    expect(result).toBeDefined();
  });

  it("ensureWorkspaceForUser returns existing workspace if present", async () => {
    setupAdminMock({
      "business_users.maybeSingle": { data: { business_id: "biz-existing" }, error: null },
    });

    const { ensureWorkspaceForUser } = await import("../lib/server-workspace");
    const result = await ensureWorkspaceForUser({
      id: "user-1",
      user_metadata: {},
    } as unknown as Parameters<typeof ensureWorkspaceForUser>[0]);

    expect(result).toBe("biz-existing");
  });

  it("getWorkspaceSecretsOrThrow decrypts stored secrets", async () => {
    setupAdminMock({
      "businesses.maybeSingle": {
        data: {
          id: "biz-1",
          whatsapp_number_id: "1234",
          whatsapp_access_token_encrypted: "enc-token",
          whatsapp_access_token_last4: "oken",
          whatsapp_app_secret_encrypted: "enc-secret",
          whatsapp_app_secret_last4: "cret",
          follow_up_enabled: false,
          follow_up_template_name: null,
          follow_up_template_language_code: "en_US",
          follow_up_template_variables: [],
        },
        error: null,
      },
    });

    const { getWorkspaceSecretsOrThrow } = await import("../lib/server-workspace");
    const secrets = await getWorkspaceSecretsOrThrow("biz-1");

    expect(secrets.accessToken).toBe("decrypted-enc-token");
    expect(secrets.appSecret).toBe("decrypted-enc-secret");
    expect(secrets.whatsappNumberId).toBe("1234");
  });
});
