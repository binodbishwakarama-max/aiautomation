import { z } from 'zod';

// ── Shared primitives ───────────────────────────────────────────────

export const uuidSchema = z.string().uuid('Must be a valid UUID');

export const workspaceIdSchema = z.object({
  workspaceId: uuidSchema,
});

// ── AI Reply ────────────────────────────────────────────────────────

export const aiReplySchema = z.object({
  conversationId: uuidSchema,
});

// ── Manual Reply ────────────────────────────────────────────────────

export const manualReplySchema = z.object({
  conversationId: uuidSchema,
  message: z.string().min(1, 'Message cannot be empty').max(4096, 'Message too long'),
});

// ── Test Connection ─────────────────────────────────────────────────

export const testConnectionSchema = z.object({
  workspaceId: uuidSchema,
  phoneNumberId: z
    .string()
    .min(1, 'Phone Number ID is required')
    .regex(/^\d+$/, 'Phone Number ID must be numeric'),
  accessToken: z.string().min(10, 'Access token is too short'),
});

// ── WhatsApp Config ─────────────────────────────────────────────────

export const whatsappConfigSchema = z.object({
  workspaceId: uuidSchema,
  whatsappNumberId: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^\d+$/.test(val.trim()),
      'WhatsApp Phone Number ID must be numeric'
    ),
  accessToken: z.string().nullable().optional(),
  clearAccessToken: z.boolean().optional().default(false),
  appSecret: z.string().nullable().optional(),
  clearAppSecret: z.boolean().optional().default(false),
  followUpEnabled: z.boolean().optional().default(false),
  followUpTemplateName: z.string().nullable().optional(),
  followUpTemplateLanguageCode: z.string().optional().default('en_US'),
  followUpTemplateVariables: z.array(z.string()).optional().default([]),
});

// ── Meta Webhook (inbound) ──────────────────────────────────────────

export const webhookVerifySchema = z.object({
  'hub.mode': z.literal('subscribe'),
  'hub.verify_token': z.string(),
  'hub.challenge': z.string(),
});

// ── Helper ──────────────────────────────────────────────────────────

/**
 * Parse and validate a request body against a Zod schema.
 * Returns `{ success: true, data }` or `{ success: false, error }`.
 */
export function parseBody<T extends z.ZodTypeAny>(
  schema: T,
  body: unknown
): { success: true; data: z.infer<T> } | { success: false; error: string } {
  const result = schema.safeParse(body);
  if (result.success) {
    return { success: true, data: result.data };
  }

  const message = result.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .filter(Boolean)
    .join('; ');

  return { success: false, error: message || 'Invalid request body' };
}
