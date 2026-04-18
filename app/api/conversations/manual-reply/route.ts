import { NextResponse } from "next/server";

import { logger } from "@/lib/logger";
import { recordUsageEvent, writeAuditLog } from "@/lib/ops";
import { getConversationAccessOrThrow, getWorkspaceSecretsOrThrow, HttpError } from "@/lib/server-workspace";
import { extractProviderMessageId, sendWhatsAppTextMessage } from "@/lib/whatsapp";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { manualReplySchema, parseBody } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = parseBody(manualReplySchema, body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { conversationId, message } = parsed.data;

    const { user, conversation } = await getConversationAccessOrThrow(conversationId, [
      "owner",
      "admin",
      "agent",
    ]);
    const secrets = await getWorkspaceSecretsOrThrow(conversation.business_id);

    if (!secrets.accessToken || !secrets.whatsappNumberId) {
      return NextResponse.json(
        { error: "WhatsApp is not configured for this workspace." },
        { status: 400 }
      );
    }

    const sendResult = await sendWhatsAppTextMessage({
      to: conversation.customer_phone,
      body: message,
      phoneNumberId: secrets.whatsappNumberId,
      accessToken: secrets.accessToken,
    });

    if (!sendResult.success) {
      return NextResponse.json({ error: sendResult.error }, { status: 502 });
    }

    const sentAt = new Date().toISOString();
    const providerMessageId = extractProviderMessageId(sendResult.data);

    await supabaseAdmin.from("messages").insert({
      conversation_id: conversationId,
      role: "assistant",
      direction: "outbound",
      content: message,
      provider_message_id: providerMessageId,
      message_type: "text",
      sender_user_id: user.id,
      metadata: {
        source: "manual",
      },
      sent_at: sentAt,
    });

    await supabaseAdmin
      .from("conversations")
      .update({
        last_message: message,
        last_message_at: sentAt,
        last_outbound_message_at: sentAt,
        status: "active",
      })
      .eq("id", conversationId);

    await recordUsageEvent({
      businessId: conversation.business_id,
      eventType: "manual_reply_sent",
      metadata: {
        conversationId,
        senderUserId: user.id,
      },
    });

    await writeAuditLog({
      businessId: conversation.business_id,
      actorUserId: user.id,
      action: "conversation.manual_reply_sent",
      entityType: "conversation",
      entityId: conversationId,
      metadata: {
        providerMessageId,
      },
    });

    return NextResponse.json({
      success: true,
      providerMessageId,
      sentAt,
    });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    logger.error("Manual reply failed", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
