import { NextResponse } from 'next/server';

import { processAiReply } from '@/lib/ai-service';
import { logger } from '@/lib/logger';
import { aiReplySchema, parseBody } from '@/lib/validation';

export async function POST(request: Request) {
  try {
    const internalSecret = request.headers.get('x-internal-secret');
    if (internalSecret !== process.env.INTERNAL_API_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = parseBody(aiReplySchema, body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const result = await processAiReply(parsed.data.conversationId);
    return NextResponse.json(result);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Internal Server Error';
    logger.error('AI Reply Route Error', { error: errorMsg });
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
