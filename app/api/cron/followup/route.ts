import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Auth: only accept calls from Vercel Cron or with valid secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    // Fetch conversations with their business settings
    const { data: conversations, error } = await supabaseAdmin
      .from('conversations')
      .select(`
        id,
        customer_phone,
        business_id,
        businesses (
          whatsapp_number_id,
          whatsapp_access_token,
          follow_up_enabled,
          follow_up_message
        )
      `)
      .eq('status', 'active')
      .lt('last_message_at', twentyFourHoursAgo.toISOString());

    if (error) {
      console.error('Error fetching conversations for follow-up:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!conversations || conversations.length === 0) {
      return NextResponse.json({ success: true, processed: 0, message: 'No eligible conversations found.' });
    }

    let processedCount = 0;
    let skippedCount = 0;
    const failures: { conversationId: string; error: string }[] = [];

    for (const conv of conversations) {
      const biz = conv.businesses as unknown as { 
        whatsapp_number_id: string; 
        whatsapp_access_token: string; 
        follow_up_enabled: boolean; 
        follow_up_message: string | null; 
      };
      if (!biz || !biz.whatsapp_number_id || !biz.whatsapp_access_token) continue;

      // Respect per-business follow-up toggle
      if (biz.follow_up_enabled === false) {
        skippedCount++;
        continue;
      }

      // Use per-business custom message, or the default
      const followUpText = biz.follow_up_message || 
        "Hi! Just checking in — did you get all the information you needed? We'd love to help you get started. 😊";

      // Send via Meta Cloud API using per-business token
      const url = `https://graph.facebook.com/v19.0/${biz.whatsapp_number_id}/messages`;
      try {
        const metaRes = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${biz.whatsapp_access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: conv.customer_phone,
            type: 'text',
            text: { body: followUpText }
          })
        });

        if (metaRes.ok) {
          // Update status and save the follow-up message for audit trail
          await supabaseAdmin
            .from('conversations')
            .update({ status: 'followed_up' })
            .eq('id', conv.id);

          await supabaseAdmin.from('messages').insert({
            conversation_id: conv.id,
            role: 'assistant',
            content: followUpText,
            sent_at: new Date().toISOString()
          });

          processedCount++;
        } else {
          const errText = await metaRes.text();
          failures.push({ conversationId: conv.id, error: errText });
        }
      } catch (sendErr) {
        failures.push({ conversationId: conv.id, error: sendErr instanceof Error ? sendErr.message : String(sendErr) });
      }
    }

    return NextResponse.json({ 
      success: true, 
      processed: processedCount, 
      skipped: skippedCount,
      failures: failures.length > 0 ? failures : undefined 
    });

  } catch (error) {
    console.error('Cron FollowUp Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
