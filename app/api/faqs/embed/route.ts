import { NextResponse } from 'next/server';

import { supabaseAdmin } from '@/lib/supabase-admin';
import { getEmbedding } from '@/lib/embedding';
import { logger } from '@/lib/logger';

export async function POST(request: Request) {
  try {
    const internalSecret = request.headers.get('x-internal-secret');
    if (internalSecret !== process.env.INTERNAL_API_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const faqId = body.faqId;

    if (!faqId) {
      return NextResponse.json({ error: 'Missing faqId' }, { status: 400 });
    }

    // 1. Fetch the FAQ question
    const { data: faq, error: fetchError } = await supabaseAdmin
      .from('faqs')
      .select('id, question')
      .eq('id', faqId)
      .maybeSingle();

    if (fetchError || !faq) {
      logger.error('Failed to fetch FAQ for embedding', { faqId, error: fetchError?.message });
      return NextResponse.json({ error: 'FAQ not found' }, { status: 404 });
    }

    // 2. Generate the embedding
    const embedding = await getEmbedding(faq.question);
    if (!embedding) {
      return NextResponse.json({ error: 'Embedding generation failed' }, { status: 500 });
    }

    // 3. Update the FAQ in the database
    const { error: updateError } = await supabaseAdmin
      .from('faqs')
      .update({ embedding })
      .eq('id', faqId);

    if (updateError) {
      logger.error('Failed to update FAQ with embedding', { faqId, error: updateError.message });
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Internal Server Error';
    logger.error('FAQ Embedding Route Error', { error: errorMsg });
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
