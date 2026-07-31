import { createHmac } from "crypto";
import { describe, expect, it } from "vitest";

import { verifyMetaWebhookSignature, extractProviderMessageId, parseMetaGraphApiError } from "../lib/whatsapp";

describe("webhook helpers", () => {
  describe("parseMetaGraphApiError", () => {
    it("classifies expired token error (Code 190 / Subcode 463)", () => {
      const errorJson = JSON.stringify({
        error: {
          message: "Error validating access token: Session has expired on Tuesday, 21-Jul-26 12:00:00 PDT.",
          type: "OAuthException",
          code: 190,
          error_subcode: 463,
        },
      });

      const parsed = parseMetaGraphApiError(errorJson);
      expect(parsed.category).toBe("EXPIRED_TOKEN");
      expect(parsed.code).toBe(190);
      expect(parsed.subcode).toBe(463);
      expect(parsed.message).toContain("WhatsApp Access Token Expired");
    });

    it("classifies invalid token error (Code 190)", () => {
      const errorJson = JSON.stringify({
        error: {
          message: "Invalid OAuth access token.",
          type: "OAuthException",
          code: 190,
        },
      });

      const parsed = parseMetaGraphApiError(errorJson);
      expect(parsed.category).toBe("INVALID_TOKEN");
      expect(parsed.code).toBe(190);
    });

    it("classifies permission denied error (Code 10)", () => {
      const errorJson = JSON.stringify({
        error: {
          message: "Application does not have permission.",
          type: "OAuthException",
          code: 10,
        },
      });

      const parsed = parseMetaGraphApiError(errorJson);
      expect(parsed.category).toBe("MISSING_PERMISSIONS");
      expect(parsed.code).toBe(10);
    });

    it("handles fallback for non-JSON string errors", () => {
      const parsed = parseMetaGraphApiError("Raw gateway timeout");
      expect(parsed.category).toBe("UNKNOWN_META_ERROR");
      expect(parsed.message).toBe("Raw gateway timeout");
    });
  });

  describe("verifyMetaWebhookSignature", () => {
    it("validates Meta webhook signatures", () => {
      const rawBody = JSON.stringify({ entry: [{ id: "1" }] });
      const appSecret = "meta-app-secret";
      const signatureHeader = `sha256=${createHmac("sha256", appSecret).update(rawBody).digest("hex")}`;

      expect(
        verifyMetaWebhookSignature({
          rawBody,
          signatureHeader,
          appSecret,
        })
      ).toBe(true);
    });

    it("rejects tampered signatures", () => {
      expect(
        verifyMetaWebhookSignature({
          rawBody: "{}",
          signatureHeader: "sha256=invalid",
          appSecret: "meta-app-secret",
        })
      ).toBe(false);
    });

    it("rejects when signature header is missing", () => {
      expect(
        verifyMetaWebhookSignature({
          rawBody: "{}",
          signatureHeader: null,
          appSecret: "meta-app-secret",
        })
      ).toBe(false);
    });

    it("rejects when app secret is missing", () => {
      expect(
        verifyMetaWebhookSignature({
          rawBody: "{}",
          signatureHeader: "sha256=something",
          appSecret: null,
        })
      ).toBe(false);
    });
  });

  describe("extractProviderMessageId", () => {
    it("extracts message ID from valid WhatsApp response", () => {
      const data = {
        messages: [{ id: "wamid.HBgNOTE3MDY1NzQ3MjU" }],
      };
      expect(extractProviderMessageId(data)).toBe("wamid.HBgNOTE3MDY1NzQ3MjU");
    });

    it("returns null for empty response", () => {
      expect(extractProviderMessageId(null)).toBeNull();
      expect(extractProviderMessageId({})).toBeNull();
      expect(extractProviderMessageId({ messages: [] })).toBeNull();
    });

    it("returns null when messages array has no id", () => {
      expect(extractProviderMessageId({ messages: [{}] })).toBeNull();
    });
  });
});
