import { beforeEach, describe, expect, it } from "vitest";

import { decryptSecret, encryptSecret, generateEncryptionKey, last4, maskSecret } from "../lib/crypto";

describe("crypto helpers", () => {
  beforeEach(() => {
    process.env.APP_ENCRYPTION_KEY = "test-key-material-for-vitest";
  });

  it("round-trips encrypted secrets", () => {
    const encrypted = encryptSecret("super-secret-token");
    expect(encrypted).not.toContain("super-secret-token");
    expect(decryptSecret(encrypted)).toBe("super-secret-token");
  });

  it("masks and fingerprints secrets safely", () => {
    expect(last4("1234567890")).toBe("7890");
    expect(maskSecret("7890")).toBe("••••••••7890");
    expect(maskSecret(null)).toBe("Not configured");
  });

  it("generates 32-byte hex keys", () => {
    const key = generateEncryptionKey();
    expect(key).toHaveLength(64);
    expect(key).toMatch(/^[0-9a-f]{64}$/);
  });

  it("supports dev fallback when APP_ENCRYPTION_KEY is unset in dev", () => {
    delete process.env.APP_ENCRYPTION_KEY;
    process.env.NODE_ENV = "development";
    const encrypted = encryptSecret("fallback-test");
    expect(decryptSecret(encrypted)).toBe("fallback-test");
  });
});
