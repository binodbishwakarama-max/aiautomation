import { NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { recordUsageEvent, writeAuditLog } from '@/lib/ops';
import { getWorkspaceSecretsOrThrow } from '@/lib/server-workspace';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { extractProviderMessageId, sendWhatsAppTemplateMessage } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: conversations, error } = await supabaseAdmin
      .from('conversations')
      .select('id, business_id, customer_phone, last_customer_message_at')
      .eq('status', 'active')
      .lt('last_customer_message_at', twentyFourHoursAgo);

    if (error) {
      logger.error('Error fetching conversations for follow-up', { error: error.message });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!conversations || conversations.length === 0) {
      return NextResponse.json({
        success: true,
        processed: 0,
        skipped: 0,
        message: 'No eligible conversations found.',
      });
    }

    let processedCount = 0;
    let skippedCount = 0;
    const failures: { conversationId: string; error: string }[] = [];

    for (const conversation of conversations) {
      try {
        const secrets = await getWorkspaceSecretsOrThrow(conversation.business_id);

        if (
          !secrets.followUpEnabled ||
          !secrets.accessToken ||
          !secrets.whatsappNumberId ||
          !secrets.followUpTemplateName
        ) {
          skippedCount += 1;
          continue;
        }

        const sendResult = await sendWhatsAppTemplateMessage({
          to: conversation.customer_phone,
          phoneNumberId: secrets.whatsappNumberId,
          accessToken: secrets.accessToken,
          templateName: secrets.followUpTemplateName,
          languageCode: secrets.followUpTemplateLanguageCode || 'en_US',
          variables: secrets.followUpTemplateVariables,
        });

        if (!sendResult.success) {
          failures.push({
            conversationId: conversation.id,
            error: sendResult.error,
          });
          continue;
        }

        const sentAt = new Date().toISOString();
        const providerMessageId = extractProviderMessageId(sendResult.data);

        await supabaseAdmin
          .from('conversations')
          .update({
            status: 'followed_up',
            last_message_at: sentAt,
            last_outbound_message_at: sentAt,
          })
          .eq('id', conversation.id);

        await supabaseAdmin.from('messages').insert({
          conversation_id: conversation.id,
          role: 'assistant',
          direction: 'outbound',
          content: `Follow-up template sent: ${secrets.followUpTemplateName}`,
          provider_message_id: providerMessageId,
          message_type: 'template',
          metadata: {
            source: 'follow_up_cron',
            templateName: secrets.followUpTemplateName,
            languageCode: secrets.followUpTemplateLanguageCode || 'en_US',
            variables: secrets.followUpTemplateVariables,
          },
          sent_at: sentAt,
        });

        await recordUsageEvent({
          businessId: conversation.business_id,
          eventType: 'follow_up_template_sent',
          metadata: {
            conversationId: conversation.id,
            providerMessageId,
          },
        });

        await writeAuditLog({
          businessId: conversation.business_id,
          action: 'conversation.follow_up_sent',
          entityType: 'conversation',
          entityId: conversation.id,
          metadata: {
            templateName: secrets.followUpTemplateName,
          },
        });

        processedCount += 1;
      } catch (loopError) {
        const errorMsg = loopError instanceof Error ? loopError.message : String(loopError);
        logger.error('Follow-up failed for conversation', { conversationId: conversation.id, error: errorMsg });
        failures.push({
          conversationId: conversation.id,
          error: errorMsg,
        });
      }
    }

    logger.info('Follow-up cron completed', { processed: processedCount, skipped: skippedCount, failures: failures.length });

    return NextResponse.json({
      success: true,
      processed: processedCount,
      skipped: skippedCount,
      failures: failures.length > 0 ? failures : undefined,
    });
  } catch (error) {
    logger.error('Cron FollowUp Error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
