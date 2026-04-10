import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const verifyToken = process.env.NEXT_PUBLIC_META_VERIFY_TOKEN;

  if (mode === 'subscribe' && token === verifyToken) {
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse('Forbidden', { status: 403 });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body.object !== 'whatsapp_business_account') {
      return new NextResponse('OK', { status: 200 });
    }

    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    
    if (!value || !value.messages || !value.messages[0]) {
      return new NextResponse('OK', { status: 200 });
    }

    const message = value.messages[0];
    const metadata = value.metadata;

    if (message.type !== 'text' || !message.text) {
      return new NextResponse('OK', { status: 200 });
    }

    const customerPhone = message.from;
    const textBody = message.text.body;
    const timestamp = new Date(parseInt(message.timestamp) * 1000).toISOString();
    const phoneNumberId = metadata.phone_number_id;

    // Look up business using admin client (bypasses RLS)
    const { data: business, error: businessError } = await supabaseAdmin
      .from('businesses')
      .select('id')
      .eq('whatsapp_number_id', phoneNumberId)
      .single();

    if (businessError || !business) {
      console.error('Business not found for phone number ID:', phoneNumberId);
      return new NextResponse('OK', { status: 200 });
    }

    // Find or create conversation
    let { data: conversation } = await supabaseAdmin
      .from('conversations')
      .select('id')
      .eq('business_id', business.id)
      .eq('customer_phone', customerPhone)
      .single();

    if (!conversation) {
      const { data: newConv, error: createError } = await supabaseAdmin
        .from('conversations')
        .insert({
          business_id: business.id,
          customer_phone: customerPhone,
          status: 'active',
          last_message: textBody,
          last_message_at: timestamp
        })
        .select('id')
        .single();
        
      if (createError) {
         console.error('Failed to create conversation:', createError);
         return new NextResponse('OK', { status: 200 });
      }
      conversation = newConv;
    } else {
      await supabaseAdmin
        .from('conversations')
        .update({ last_message: textBody, last_message_at: timestamp })
        .eq('id', conversation.id);
    }

    if (!conversation) {
      return new NextResponse('OK', { status: 200 });
    }

    // Save message
    const { error: msgError } = await supabaseAdmin
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        role: 'user',
        content: textBody,
        sent_at: timestamp
      });

    if (msgError) {
      console.error('Failed to save message:', msgError);
    }

    // Fire-and-forget AI reply with internal secret
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const host = request.headers.get('host');
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;
    
    await fetch(`${appUrl}/api/ai-reply`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-internal-secret': process.env.INTERNAL_API_SECRET || ''
      },
      body: JSON.stringify({ conversationId: conversation.id })
    }).catch(err => console.error('Error triggering AI reply:', err));

    return new NextResponse('OK', { status: 200 });

  } catch (error) {
    console.error('Webhook Error:', error);
    return new NextResponse('OK', { status: 200 });
  }
}
