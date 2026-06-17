import { NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { recordUsageEvent } from '@/lib/ops';
import { getWorkspaceSecretsOrThrow } from '@/lib/server-workspace';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyMetaWebhookSignature } from '@/lib/whatsapp';

function getVerifyToken() {
  return process.env.META_VERIFY_TOKEN || process.env.NEXT_PUBLIC_META_VERIFY_TOKEN;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === getVerifyToken()) {
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse('Forbidden', { status: 403 });
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signatureHeader = request.headers.get('x-hub-signature-256');

    let body: Record<string, unknown>;
    try {
      body = JSON.parse(rawBody);
    } catch {
      logger.warn('Webhook received non-JSON body');
      return new NextResponse('OK', { status: 200 });
    }

    if (body.object !== 'whatsapp_business_account') {
      return new NextResponse('OK', { status: 200 });
    }

    const entry = (body.entry as Record<string, unknown>[] | undefined)?.[0];
    const change = (entry?.changes as Record<string, unknown>[] | undefined)?.[0];
    const value = change?.value as Record<string, unknown> | undefined;
    const message = (value?.messages as Record<string, unknown>[] | undefined)?.[0];
    const metadata = value?.metadata as Record<string, unknown> | undefined;

    if (!value || !message || !metadata?.phone_number_id) {
      return new NextResponse('OK', { status: 200 });
    }

    if (message.type !== 'text' && message.type !== 'audio') {
      return new NextResponse('OK', { status: 200 });
    }

    const phoneNumberId = metadata.phone_number_id as string;
    const providerMessageId = typeof message.id === 'string' ? message.id : null;
    const customerPhone = String(message.from || '');
    
    const timestampSeconds = Number.parseInt(String(message.timestamp || ''), 10);
    const timestamp = Number.isFinite(timestampSeconds)
      ? new Date(timestampSeconds * 1000).toISOString()
      : new Date().toISOString();
    const profileName =
      typeof (value.contacts as Record<string, unknown>[] | undefined)?.[0]?.profile === 'object'
        ? ((value.contacts as Record<string, Record<string, string>>[])[0].profile?.name ?? null)
        : null;

    const { data: business, error: businessError } = await supabaseAdmin
      .from('businesses')
      .select('id')
      .eq('whatsapp_number_id', phoneNumberId)
      .maybeSingle();

    if (businessError || !business) {
      logger.warn('Business not found for phone number ID', { phoneNumberId });
      return new NextResponse('OK', { status: 200 });
    }

    const secrets = await getWorkspaceSecretsOrThrow(business.id);
    if (
      !verifyMetaWebhookSignature({
        rawBody,
        signatureHeader,
        appSecret: secrets.appSecret,
      })
    ) {
      logger.warn('Webhook signature verification failed', { businessId: business.id });
      return new NextResponse('Unauthorized', { status: 401 });
    }

    if (providerMessageId) {
      const { data: existingMessage } = await supabaseAdmin
        .from('messages')
        .select('id')
        .eq('provider_message_id', providerMessageId)
        .maybeSingle();

      if (existingMessage) {
        return new NextResponse('OK', { status: 200 });
      }
    }

    let textBody = '';
    let isVoiceNote = false;
    let audioUrl = '';

    if (message.type === 'text') {
      textBody = (message.text as Record<string, string>)?.body || '';
    } else if (message.type === 'audio' && (message.audio as Record<string, string>)?.id) {
      isVoiceNote = true;
      const audioId = (message.audio as Record<string, string>).id;
      try {
        const { downloadWhatsAppMedia } = await import('@/lib/whatsapp');
        const { buffer, mimeType } = await downloadWhatsAppMedia(audioId, secrets.accessToken!);
        
        // Upload to Supabase Storage
        try {
          const fileName = `${business.id}/${providerMessageId || Date.now()}.ogg`;
          const { error: uploadError } = await supabaseAdmin.storage
            .from('voice-notes')
            .upload(fileName, buffer, {
              contentType: mimeType,
              upsert: true,
            });

          if (!uploadError) {
            const { data: { publicUrl } } = supabaseAdmin.storage
              .from('voice-notes')
              .getPublicUrl(fileName);
            audioUrl = publicUrl;
          } else {
            logger.error('Failed to upload audio to Supabase Storage', { error: uploadError.message });
          }
        } catch (storageErr) {
          logger.error('Failed storage upload process', { error: storageErr instanceof Error ? storageErr.message : String(storageErr) });
        }

        // Pass to Groq Whisper
        const GroqResponse = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          },
          body: (() => {
            const formData = new FormData();
            // WhatsApp typical ogg format
            let ext = "ogg";
            if (mimeType.includes("mp4")) ext = "mp4";
            if (mimeType.includes("mpeg")) ext = "mp3";
            const file = new File([buffer], `audio.${ext}`, { type: mimeType });
            formData.append("file", file);
            formData.append("model", "whisper-large-v3");
            formData.append("temperature", "0");
            formData.append("response_format", "json");
            return formData;
          })()
        });

        if (!GroqResponse.ok) {
           throw new Error(await GroqResponse.text());
        }

        const groqData = await GroqResponse.json();
        textBody = `[Voice Note] Transcribed: ${groqData.text}`;
      } catch (audioError) {
        logger.error('Failed to process voice note', { error: audioError instanceof Error ? audioError.message : String(audioError) });
        textBody = `[Voice Note] (Transcription failed)`;
      }
    }

    if (!textBody.trim()) {
      return new NextResponse('OK', { status: 200 });
    }

    const conversationPayload: Record<string, unknown> = {
      business_id: business.id,
      customer_phone: customerPhone,
      status: 'active',
      last_message: textBody,
      last_message_at: timestamp,
      last_customer_message_at: timestamp,
    };

    if (profileName) {
      conversationPayload.customer_name = profileName;
    }

    const { data: conversation, error: conversationError } = await supabaseAdmin
      .from('conversations')
      .upsert(
        conversationPayload,
        {
          onConflict: 'business_id,customer_phone',
        }
      )
      .select('id')
      .single();

    if (conversationError || !conversation) {
      logger.error('Failed to upsert conversation', { error: conversationError?.message });
      return new NextResponse('OK', { status: 200 });
    }

    const messageMetadata: Record<string, unknown> = {
      phoneNumberId,
    };
    if (audioUrl) {
      messageMetadata.audioUrl = audioUrl;
    }

    const { error: messageError } = await supabaseAdmin.from('messages').insert({
      conversation_id: conversation.id,
      role: 'user',
      direction: 'inbound',
      content: textBody,
      provider_message_id: providerMessageId,
      message_type: isVoiceNote ? 'audio' : 'text',
      metadata: messageMetadata,
      sent_at: timestamp,
    });

    if (messageError) {
      if (messageError.code === '23505') {
        return new NextResponse('OK', { status: 200 });
      }

      logger.error('Failed to save inbound message', { error: messageError.message });
      return new NextResponse('OK', { status: 200 });
    }

    await recordUsageEvent({
      businessId: business.id,
      eventType: 'inbound_message_received',
      metadata: {
        conversationId: conversation.id,
        providerMessageId,
      },
    });

    // AI reply trigger is handled asynchronously via PostgreSQL net.http_post
    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    logger.error('Webhook Error', { error: error instanceof Error ? error.message : String(error) });
    return new NextResponse('OK', { status: 200 });
  }
}
