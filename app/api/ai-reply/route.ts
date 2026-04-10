import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { groq } from '@/lib/groq';

type ChatMessageRole = 'system' | 'user' | 'assistant';

export async function POST(request: Request) {
  try {
    // Auth: only accept calls from our own webhook
    const internalSecret = request.headers.get('x-internal-secret');
    if (internalSecret !== process.env.INTERNAL_API_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { conversationId } = body;
    let { business_id, incoming_message, customer_phone } = body;

    // 1. Fetch conversation
    let conversation;
    if (!business_id || !customer_phone) {
      const { data: conv, error: convError } = await supabaseAdmin
        .from('conversations')
        .select('id, business_id, customer_phone, customer_name, last_message')
        .eq('id', conversationId)
        .single();
        
      if (convError || !conv) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
      }
      conversation = conv;
      business_id = conv.business_id;
      customer_phone = conv.customer_phone;
      if (!incoming_message) incoming_message = conv.last_message;
    } else {
      const { data: conv } = await supabaseAdmin
        .from('conversations')
        .select('id, business_id, customer_phone, customer_name, last_message')
        .eq('id', conversationId)
        .single();
      conversation = conv;
    }

    // 2. Fetch business — including per-tenant token
    const { data: business } = await supabaseAdmin
      .from('businesses')
      .select('name, whatsapp_number_id, whatsapp_access_token')
      .eq('id', business_id)
      .single();

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // 3. Fetch FAQs
    const { data: faqs } = await supabaseAdmin
      .from('faqs')
      .select('question, answer')
      .eq('business_id', business_id);

    const faqText = faqs?.map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n') || 'No FAQs available.';

    // 4. Fetch last 10 messages for context
    const { data: recentMessages } = await supabaseAdmin
      .from('messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('sent_at', { ascending: false })
      .limit(10);

    const chatHistory = (recentMessages || []).reverse().map(msg => ({
      role: msg.role as ChatMessageRole,
      content: msg.content
    }));

    // 5. System prompt
    const systemPrompt = `You are a helpful WhatsApp assistant for ${business.name}, a coaching institute.
Your job is to answer student and parent inquiries politely and professionally.
Keep replies short (2-4 sentences max) — this is WhatsApp, not email.
Only answer from the provided FAQ knowledge base.
If you cannot answer confidently, say: 'Let me connect you with our team. Please hold for a moment.' and set escalate=true in your response.
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

    // 6. Call Groq
    const response = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: systemPrompt },
        ...chatHistory
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2
    });

    const jsonMessage = response.choices[0]?.message?.content;
    if (!jsonMessage) throw new Error('Empty response from Groq');
    
    let parsedParams;
    try {
      parsedParams = JSON.parse(jsonMessage);
    } catch {
      console.error('Failed to parse Groq response:', jsonMessage);
      throw new Error('Invalid JSON from Groq');
    }

    const { reply, escalate, capture_lead, customer_name } = parsedParams;

    // 7. Save AI reply
    await supabaseAdmin.from('messages').insert({
      conversation_id: conversationId,
      role: 'assistant',
      content: reply
    });

    // 8. Capture lead if needed
    if (capture_lead || customer_name) {
      const { data: existingLead } = await supabaseAdmin
        .from('leads')
        .select('id')
        .eq('phone', customer_phone)
        .eq('business_id', business_id)
        .single();
      
      if (!existingLead) {
        await supabaseAdmin.from('leads').insert({
          business_id,
          name: customer_name || 'Unknown',
          phone: customer_phone,
          source: 'whatsapp',
          status: 'new',
          notes: 'Automatically captured by AI Assistant'
        });
      }
    }

    // 9. Escalate if needed
    if (escalate) {
      await supabaseAdmin.from('conversations').update({ status: 'escalated' }).eq('id', conversationId);
    }

    if (customer_name && !conversation?.customer_name) {
      await supabaseAdmin.from('conversations').update({ customer_name }).eq('id', conversationId);
    }

    // 10. Send reply via Meta — use per-business token from DB, fallback to env
    const metaToken = business.whatsapp_access_token || process.env.META_WHATSAPP_TOKEN;
    if (metaToken && business.whatsapp_number_id) {
      const whatsappUrl = `https://graph.facebook.com/v19.0/${business.whatsapp_number_id}/messages`;
      const metaRes = await fetch(whatsappUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${metaToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: customer_phone,
          type: 'text',
          text: { body: reply }
        })
      });
      
      if (!metaRes.ok) {
        const errorData = await metaRes.text();
        console.error('Meta API Error:', errorData);
      }
    } else {
      console.warn('No WhatsApp token available for business:', business_id);
    }

    return NextResponse.json({ success: true, ai_response: parsedParams });

  } catch (error) {
    console.error('AI Reply Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
