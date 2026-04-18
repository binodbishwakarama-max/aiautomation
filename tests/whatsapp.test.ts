import { createHmac } from "crypto";
import { describe, expect, it } from "vitest";

import { verifyMetaWebhookSignature, extractProviderMessageId } from "../lib/whatsapp";

describe("webhook helpers", () => {
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
