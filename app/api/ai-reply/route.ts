import { NextResponse } from 'next/server';
import { processAiReply } from '@/lib/ai-service';

export async function POST(request: Request) {
  try {
    const internalSecret = request.headers.get('x-internal-secret');
    if (internalSecret !== process.env.INTERNAL_API_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId } = await request.json();
    if (!conversationId) {
      return NextResponse.json({ error: 'conversationId required' }, { status: 400 });
    }

    const result = await processAiReply(conversationId);
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('AI Reply Route Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
