import { supabaseAdmin } from '@/lib/supabase-admin';
import { groq } from '@/lib/groq';
import { logger } from '@/lib/logger';
import { recordUsageEvent, writeAuditLog } from '@/lib/ops';
import { getWorkspaceSecretsOrThrow } from '@/lib/server-workspace';
import { extractProviderMessageId, sendWhatsAppTextMessage } from '@/lib/whatsapp';
import { getEmbedding } from '@/lib/embedding';


type ChatMessageRole = 'system' | 'user' | 'assistant';

const MAX_RETRIES = 1;
const RETRY_DELAY_MS = 1500;

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callGroqWithRetry(
  messages: Array<{ role: ChatMessageRole; content: string }>
) {
  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages,
        response_format: { type: 'json_object' },
        temperature: 0.2,
      });

      return response;
    } catch (error) {
      lastError = error;
      if (attempt < MAX_RETRIES) {
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt);
        logger.warn('Groq API call failed, retrying', {
          attempt: attempt + 1,
          maxRetries: MAX_RETRIES,
          delayMs: delay,
          error: error instanceof Error ? error.message : String(error),
        });
        await sleep(delay);
      }
    }
  }

  throw lastError;
}

async function callOpenRouter(
  messages: Array<{ role: ChatMessageRole; content: string }>
) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not set');
  }

  // OpenRouter free models: meta-llama/llama-3.3-70b-instruct:free, deepseek/deepseek-r1:free, qwen/qwen-2.5-72b-instruct:free
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://replysync.app',
      'X-Title': 'ReplySync',
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-3.3-70b-instruct:free',
      messages,
      response_format: { type: 'json_object' },
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`OpenRouter HTTP ${res.status}: ${errorText}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('OpenRouter response content was empty');
  }

  return content;
}

async function callAiWithFallback(
  messages: Array<{ role: ChatMessageRole; content: string }>
): Promise<string> {
  // 1. Primary Provider: Groq (Llama 3.1 8B Instant)
  try {
    const groqResponse = await callGroqWithRetry(messages);
    const content = groqResponse.choices[0]?.message?.content;
    if (content) {
      return content;
    }
  } catch (groqError) {
    logger.warn('Groq primary model failed. Attempting OpenRouter fallback...', {
      error: groqError instanceof Error ? groqError.message : String(groqError),
    });
  }

  // 2. Secondary Provider: OpenRouter (100% Free Tier Models like Llama 3.3 70B / DeepSeek R1)
  if (process.env.OPENROUTER_API_KEY) {
    try {
      const openRouterContent = await callOpenRouter(messages);
      logger.info('Successfully generated AI response via OpenRouter fallback');
      return openRouterContent;
    } catch (openRouterError) {
      logger.error('OpenRouter fallback also failed', {
        error: openRouterError instanceof Error ? openRouterError.message : String(openRouterError),
      });
    }
  }

  // 3. Ultimate Fallback: Return structured JSON for human escalation
  logger.warn('All AI providers failed or unconfigured. Triggering human escalation fallback.');
  return JSON.stringify({
    reply: 'Thank you for reaching out! Our team has been notified and will assist you shortly.',
    escalate: true,
    capture_lead: false,
    customer_name: null,
  });
}

export async function processAiReply(conversationId: string) {
  try {
    const { data: conv, error: convError } = await supabaseAdmin
      .from('conversations')
      .select('id, business_id, customer_phone, customer_name, last_message')
      .eq('id', conversationId)
      .single();

    if (convError || !conv) {
      throw new Error('Conversation not found');
    }

    const { data: business, error: businessError } = await supabaseAdmin
      .from('businesses')
      .select('name, business_type')
      .eq('id', conv.business_id)
      .single();

    if (businessError || !business) {
      throw new Error('Business not found');
    }

    const secrets = await getWorkspaceSecretsOrThrow(conv.business_id);

    // RAG: Match FAQs by cosine similarity using Hugging Face embeddings
    let faqs: Array<{ question: string; answer: string }> | null = null;
    try {
      if (conv.last_message) {
        const queryEmbedding = await getEmbedding(conv.last_message);
        if (queryEmbedding) {
          const { data: matchedFaqs, error: matchError } = await supabaseAdmin.rpc('match_faqs', {
            query_embedding: queryEmbedding,
            target_business_id: conv.business_id,
            match_threshold: 0.35, // similarity threshold
            match_count: 4, // top 4 matches
          });

          if (!matchError && matchedFaqs && matchedFaqs.length > 0) {
            faqs = matchedFaqs;
          }
        }
      }
    } catch (ragError) {
      logger.error('RAG matching failed, falling back to all FAQs', { error: String(ragError) });
    }

    // Fallback: If RAG fails or finds nothing, load standard ordered FAQs
    if (!faqs) {
      const { data: fallbackFaqs } = await supabaseAdmin
        .from('faqs')
        .select('question, answer')
        .eq('business_id', conv.business_id)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: true })
        .limit(15);
      faqs = fallbackFaqs;
    }

    const faqText =
      faqs?.map((faq) => `Q: ${faq.question}\nA: ${faq.answer}`).join('\n\n') || 'No FAQs available.';


    const { data: recentMessages } = await supabaseAdmin
      .from('messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('sent_at', { ascending: false })
      .limit(10);

    const chatHistory = (recentMessages || []).reverse().map((message) => ({
      role: message.role as ChatMessageRole,
      content: message.content,
    }));

    const systemPrompt = `You are a helpful WhatsApp assistant for ${business.name}, a ${business.business_type || 'business'}.
Your job is to answer customer inquiries politely and professionally.
Keep replies short (2-4 sentences max).
Only answer from the provided FAQ knowledge base.
If you cannot answer confidently, say: 'Let me connect you with our team. Please hold for a moment.' and set escalate=true.
If the user provides their name and is asking about enrollment, set capture_lead=true.

FAQ Knowledge Base:
${faqText}

Respond in JSON format only:
{
  "reply": "string",
  "escalate": boolean,
  "capture_lead": boolean,
  "customer_name": "string | null"
}`;

    const rawContent = await callAiWithFallback([
      { role: 'system', content: systemPrompt },
      ...chatHistory,
    ]);

    const cleanedContent = rawContent.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
    const parsed = JSON.parse(cleanedContent);
    const reply = typeof parsed.reply === 'string' ? parsed.reply.trim() : '';
    const escalate = Boolean(parsed.escalate);
    const captureLead = Boolean(parsed.capture_lead);
    const customerName = typeof parsed.customer_name === 'string' ? parsed.customer_name.trim() : null;

    if (!reply) {
      throw new Error('AI reply payload was empty');
    }

    if (!secrets.accessToken || !secrets.whatsappNumberId) {
      throw new Error('WhatsApp is not configured for this workspace');
    }

    const sendResult = await sendWhatsAppTextMessage({
      to: conv.customer_phone,
      body: reply,
      phoneNumberId: secrets.whatsappNumberId,
      accessToken: secrets.accessToken,
    });

    if (!sendResult.success) {
      throw new Error(`WhatsApp send failed: ${sendResult.error}`);
    }

    const providerMessageId = extractProviderMessageId(sendResult.data);

    const sentAt = new Date().toISOString();

    await supabaseAdmin.from('messages').insert({
      conversation_id: conversationId,
      role: 'assistant',
      direction: 'outbound',
      content: reply,
      provider_message_id: providerMessageId,
      message_type: 'text',
      metadata: {
        source: 'ai',
        escalate,
      },
      sent_at: sentAt,
    });

    if (captureLead || customerName) {
      const { data: existingLead } = await supabaseAdmin
        .from('leads')
        .select('id')
        .eq('phone', conv.customer_phone)
        .eq('business_id', conv.business_id)
        .maybeSingle();

      if (!existingLead) {
        await supabaseAdmin.from('leads').insert({
          business_id: conv.business_id,
          name: customerName || 'Unknown',
          phone: conv.customer_phone,
          source: 'whatsapp',
          status: 'new',
          notes: 'Automatically captured by AI assistant',
        });
      }
    }

    await supabaseAdmin
      .from('conversations')
      .update({
        customer_name: customerName || conv.customer_name,
        status: escalate ? 'escalated' : 'active',
        last_message: reply,
        last_message_at: sentAt,
        last_outbound_message_at: sentAt,
      })
      .eq('id', conversationId);

    await recordUsageEvent({
      businessId: conv.business_id,
      eventType: 'ai_reply_sent',
      metadata: {
        conversationId,
        escalated: escalate,
      },
    });

    if (escalate) {
      await writeAuditLog({
        businessId: conv.business_id,
        action: 'conversation.escalated_by_ai',
        entityType: 'conversation',
        entityId: conversationId,
        metadata: {
          customerPhone: conv.customer_phone,
        },
      });
    }

    return { success: true, reply, escalated: escalate };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('AI Processing Error', { conversationId, error: errorMessage });

    try {
      await supabaseAdmin
        .from('conversations')
        .update({ status: 'escalated' })
        .eq('id', conversationId);
    } catch (updateError) {
      logger.error('Failed to mark conversation as escalated after AI error', {
        conversationId,
        error: updateError instanceof Error ? updateError.message : String(updateError),
      });
    }

    throw new Error(errorMessage);
  }
}
