import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock Supabase admin
vi.mock("../lib/supabase-admin", () => ({
  supabaseAdmin: {
    from: vi.fn(),
  },
}));

// Mock Groq
vi.mock("../lib/groq", () => ({
  groq: {
    chat: {
      completions: {
        create: vi.fn(),
      },
    },
  },
}));

// Mock ops
vi.mock("../lib/ops", () => ({
  recordUsageEvent: vi.fn(),
  writeAuditLog: vi.fn(),
}));

// Mock server-workspace
vi.mock("../lib/server-workspace", () => ({
  getWorkspaceSecretsOrThrow: vi.fn(),
}));

// Mock whatsapp
vi.mock("../lib/whatsapp", () => ({
  sendWhatsAppTextMessage: vi.fn(),
  extractProviderMessageId: vi.fn(() => "wamid.test123"),
}));

import { groq } from "../lib/groq";
import { supabaseAdmin } from "../lib/supabase-admin";
import { getWorkspaceSecretsOrThrow } from "../lib/server-workspace";
import { sendWhatsAppTextMessage } from "../lib/whatsapp";

describe("processAiReply", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function setupMocks(overrides?: {
    reply?: string;
    escalate?: boolean;
    captureLead?: boolean;
  }) {
    const reply = overrides?.reply ?? "Hello! How can I help?";
    const escalate = overrides?.escalate ?? false;
    const captureLead = overrides?.captureLead ?? false;

    const fromMock = supabaseAdmin.from as ReturnType<typeof vi.fn>;

    fromMock.mockImplementation((table: string) => {
      const makeChain = (): Record<string, unknown> => {
        const c: Record<string, unknown> = {
          select: vi.fn(() => c),
          eq: vi.fn(() => c),
          order: vi.fn(() => c),
          limit: vi.fn(() => c),
          single: vi.fn(),
          maybeSingle: vi.fn(),
          insert: vi.fn().mockResolvedValue({ error: null }),
          update: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) })),
          delete: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) })),
        };
        return c;
      };
      const chain = makeChain();

      if (table === "conversations") {
        (chain.single as ReturnType<typeof vi.fn>).mockResolvedValue({
          data: {
            id: "conv-1",
            business_id: "biz-1",
            customer_phone: "+1234567890",
            customer_name: null,
            last_message: "Hi",
          },
          error: null,
        });
      } else if (table === "businesses") {
        (chain.single as ReturnType<typeof vi.fn>).mockResolvedValue({
          data: { name: "Test Biz", business_type: "coaching_institute" },
          error: null,
        });
      } else if (table === "faqs") {
        (chain.order as ReturnType<typeof vi.fn>).mockReturnValue({
          ...chain,
          order: vi.fn().mockResolvedValue({
            data: [{ question: "What courses?", answer: "Math and Science." }],
            error: null,
          }),
        });
      } else if (table === "messages") {
        (chain.order as ReturnType<typeof vi.fn>).mockReturnValue({
          ...chain,
          limit: vi.fn().mockResolvedValue({
            data: [{ role: "user", content: "Hi" }],
            error: null,
          }),
        });
      } else if (table === "leads") {
        (chain.maybeSingle as ReturnType<typeof vi.fn>).mockResolvedValue({ data: null, error: null });
      }

      return chain;
    });

    vi.mocked(getWorkspaceSecretsOrThrow).mockResolvedValue({
      id: "biz-1",
      whatsappNumberId: "123456",
      accessToken: "token-abc",
      accessTokenLast4: "t-abc",
      appSecret: "secret",
      appSecretLast4: "cret",
      followUpEnabled: false,
      followUpTemplateName: null,
      followUpTemplateLanguageCode: "en_US",
      followUpTemplateVariables: [],
    });

    vi.mocked(groq.chat.completions.create).mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              reply,
              escalate,
              capture_lead: captureLead,
              customer_name: captureLead ? "John" : null,
            }),
          },
        },
      ],
    } as unknown as Awaited<ReturnType<typeof groq.chat.completions.create>>);

    vi.mocked(sendWhatsAppTextMessage).mockResolvedValue({
      success: true as const,
      data: { messages: [{ id: "wamid.test123" }] },
    });
  }

  it("should process a basic AI reply successfully", async () => {
    setupMocks();

    const { processAiReply } = await import("../lib/ai-service");
    const result = await processAiReply("conv-1");

    expect(result.success).toBe(true);
    expect(result.reply).toBe("Hello! How can I help?");
    expect(result.escalated).toBe(false);
    expect(groq.chat.completions.create).toHaveBeenCalledOnce();
    expect(sendWhatsAppTextMessage).toHaveBeenCalledOnce();
  });

  it("should escalate when AI says escalate=true", async () => {
    setupMocks({ escalate: true, reply: "Let me connect you with our team." });

    const { processAiReply } = await import("../lib/ai-service");
    const result = await processAiReply("conv-1");

    expect(result.escalated).toBe(true);
  });

  it("throws when Groq returns empty content", async () => {
    setupMocks();

    vi.mocked(groq.chat.completions.create).mockResolvedValue({
      choices: [{ message: { content: null } }],
    } as unknown as Awaited<ReturnType<typeof groq.chat.completions.create>>);

    const { processAiReply } = await import("../lib/ai-service");
    await expect(processAiReply("conv-1")).rejects.toThrow("Empty response from Groq");
  });
});
