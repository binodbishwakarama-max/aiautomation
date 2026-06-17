-- ─────────────────────────────────────────────────────────────
-- ReplySync Upgrade Migration
-- Run this in your Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────

-- 1. Enable Extensions
CREATE EXTENSION IF NOT EXISTS "pg_net";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 2. Add embedding column to public.faqs
ALTER TABLE public.faqs ADD COLUMN IF NOT EXISTS embedding vector(384);

-- 3. Create RAG Similarity Search Function
CREATE OR REPLACE FUNCTION public.match_faqs(
  query_embedding vector(384),
  target_business_id UUID,
  match_threshold FLOAT,
  match_count INT
)
RETURNS TABLE (
  id UUID,
  business_id UUID,
  question TEXT,
  answer TEXT,
  display_order INT,
  created_at TIMESTAMPTZ,
  similarity FLOAT
)
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    id,
    business_id,
    question,
    answer,
    display_order,
    created_at,
    1 - (embedding <=> query_embedding) AS similarity
  FROM public.faqs
  WHERE business_id = target_business_id
    AND 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
$$;

-- 4. Create Background HTTP Trigger for Webhook Queueing
CREATE OR REPLACE FUNCTION public.trigger_ai_reply_on_inbound()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url TEXT;
  internal_secret TEXT;
BEGIN
  -- Only trigger for inbound customer messages
  IF NEW.direction = 'inbound' AND NEW.role = 'user' THEN
    
    -- NOTE: Change this URL to your production domain (e.g. 'https://yourdomain.com/api/ai-reply') in production
    webhook_url := 'http://localhost:3000/api/ai-reply';
    
    -- The internal secret shared with the Next.js API route
    internal_secret := 'rs_internal_webhook_secret_key_123';

    PERFORM net.http_post(
      url := webhook_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-internal-secret', internal_secret
      ),
      body := jsonb_build_object('conversationId', NEW.conversation_id),
      timeout_milliseconds := 10000
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Attach trigger to public.messages table
DROP TRIGGER IF EXISTS trg_inbound_message_ai_reply ON public.messages;
CREATE TRIGGER trg_inbound_message_ai_reply
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.trigger_ai_reply_on_inbound();

-- 6. Create trigger for FAQ Embeddings on Insert/Update
CREATE OR REPLACE FUNCTION public.trigger_faq_embed_on_change()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url TEXT;
  internal_secret TEXT;
BEGIN
  -- NOTE: Change this URL to your production domain (e.g. 'https://yourdomain.com/api/faqs/embed') in production
  webhook_url := 'http://localhost:3000/api/faqs/embed';
  
  -- The internal secret shared with the Next.js API route
  internal_secret := 'rs_internal_webhook_secret_key_123';

  -- Check if it's a new FAQ or the question has changed
  IF (TG_OP = 'INSERT') OR (NEW.question IS DISTINCT FROM OLD.question) THEN
    PERFORM net.http_post(
      url := webhook_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-internal-secret', internal_secret
      ),
      body := jsonb_build_object('faqId', NEW.id),
      timeout_milliseconds := 10000
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Attach trigger to public.faqs table
DROP TRIGGER IF EXISTS trg_faq_embed ON public.faqs;
CREATE TRIGGER trg_faq_embed
AFTER INSERT OR UPDATE ON public.faqs
FOR EACH ROW
EXECUTE FUNCTION public.trigger_faq_embed_on_change();
