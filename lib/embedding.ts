import { logger } from '@/lib/logger';

function flattenEmbedding(val: unknown): number[] {
  if (Array.isArray(val)) {
    if (val.length === 0) {
      throw new Error('Received empty embedding array');
    }
    if (typeof val[0] === 'number') {
      return val as number[];
    }
    return flattenEmbedding(val[0]);
  }
  throw new Error('Invalid embedding format from Hugging Face');
}

export async function getEmbedding(text: string): Promise<number[] | null> {
  const cleanText = text.trim().replace(/\n/g, ' ');
  if (!cleanText) {
    return null;
  }

  const model = 'sentence-transformers/all-MiniLM-L6-v2';
  const url = `https://api-inference.huggingface.co/pipeline/feature-extraction/${model}`;
  
  const token = process.env.HF_ACCESS_TOKEN;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token && token !== 'your_huggingface_token_here') {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ inputs: cleanText }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Hugging Face embedding request failed', {
        status: response.status,
        error: errorText,
      });
      return null;
    }

    const data = await response.json();
    return flattenEmbedding(data);
  } catch (error) {
    logger.error('Error generating embedding', {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}
