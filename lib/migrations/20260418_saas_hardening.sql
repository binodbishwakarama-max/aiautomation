-- Existing deployment migration for the SaaS hardening release.
-- Run this after the original schema has already been applied.
-- Existing plaintext tokens are intentionally not copied into encrypted columns.
-- Re-enter them through the updated Settings UI after deploying the app changes.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.user_business_role(target_business_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT bu.role
    FROM public.business_users bu
    WHERE bu.business_id = target_business_id
      AND bu.user_id = auth.uid()
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.user_belongs_to_business(target_business_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.business_users bu
        WHERE bu.business_id = target_business_id
          AND bu.user_id = auth.uid()
    );
$$;

CREATE OR REPLACE FUNCTION public.user_has_business_role(target_business_id UUID, allowed_roles TEXT[])
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.business_users bu
        WHERE bu.business_id = target_business_id
          AND bu.user_id = auth.uid()
          AND bu.role = ANY (allowed_roles)
    );
$$;

CREATE OR REPLACE FUNCTION public.ensure_business_for_current_user(default_business_name TEXT DEFAULT NULL)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_id UUID;
    current_business_id UUID;
    normalized_name TEXT;
BEGIN
    current_user_id := auth.uid();

    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT bu.business_id
    INTO current_business_id
    FROM public.business_users bu
    WHERE bu.user_id = current_user_id
    ORDER BY bu.created_at ASC
    LIMIT 1;

    IF current_business_id IS NOT NULL THEN
        RETURN current_business_id;
    END IF;

    normalized_name := COALESCE(NULLIF(BTRIM(default_business_name), ''), 'My Workspace');

    INSERT INTO public.businesses (name)
    VALUES (normalized_name)
    RETURNING id INTO current_business_id;

    INSERT INTO public.business_users (business_id, user_id, role)
    VALUES (current_business_id, current_user_id, 'owner');

    RETURN current_business_id;
END;
$$;

ALTER TABLE public.businesses
    ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
    ADD COLUMN IF NOT EXISTS whatsapp_access_token_encrypted TEXT,
    ADD COLUMN IF NOT EXISTS whatsapp_access_token_last4 TEXT,
    ADD COLUMN IF NOT EXISTS whatsapp_app_secret_encrypted TEXT,
    ADD COLUMN IF NOT EXISTS whatsapp_app_secret_last4 TEXT,
    ADD COLUMN IF NOT EXISTS plan_key TEXT NOT NULL DEFAULT 'starter',
    ADD COLUMN IF NOT EXISTS seat_limit INTEGER NOT NULL DEFAULT 3,
    ADD COLUMN IF NOT EXISTS monthly_message_limit INTEGER NOT NULL DEFAULT 1000,
    ADD COLUMN IF NOT EXISTS follow_up_template_name TEXT,
    ADD COLUMN IF NOT EXISTS follow_up_template_language_code TEXT DEFAULT 'en_US',
    ADD COLUMN IF NOT EXISTS follow_up_template_variables JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

UPDATE public.businesses
SET whatsapp_access_token_last4 = RIGHT(whatsapp_access_token, 4)
WHERE whatsapp_access_token IS NOT NULL
  AND whatsapp_access_token_last4 IS NULL;

ALTER TABLE public.faqs
    ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.conversations
    ADD COLUMN IF NOT EXISTS last_customer_message_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS last_outbound_message_at TIMESTAMPTZ;

ALTER TABLE public.messages
    ADD COLUMN IF NOT EXISTS direction TEXT NOT NULL DEFAULT 'inbound',
    ADD COLUMN IF NOT EXISTS provider_message_id TEXT UNIQUE,
    ADD COLUMN IF NOT EXISTS message_type TEXT NOT NULL DEFAULT 'text',
    ADD COLUMN IF NOT EXISTS sender_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'leads_business_phone_unique'
    ) THEN
        ALTER TABLE public.leads
            ADD CONSTRAINT leads_business_phone_unique UNIQUE (business_id, phone);
    END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.business_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'agent')),
    invitation_token TEXT NOT NULL UNIQUE,
    invited_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.billing_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL UNIQUE REFERENCES public.businesses(id) ON DELETE CASCADE,
    provider TEXT NOT NULL DEFAULT 'manual',
    provider_customer_id TEXT,
    provider_subscription_id TEXT,
    plan_key TEXT NOT NULL DEFAULT 'starter',
    status TEXT NOT NULL DEFAULT 'trialing' CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'incomplete')),
    seat_limit INTEGER NOT NULL DEFAULT 3 CHECK (seat_limit > 0),
    monthly_message_limit INTEGER NOT NULL DEFAULT 1000 CHECK (monthly_message_limit >= 0),
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.usage_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_businesses_plan_key ON public.businesses(plan_key);
CREATE INDEX IF NOT EXISTS idx_businesses_whatsapp_number_id ON public.businesses(whatsapp_number_id);
CREATE INDEX IF NOT EXISTS idx_faqs_business_id_order ON public.faqs(business_id, display_order, created_at);
CREATE INDEX IF NOT EXISTS idx_conversations_business_status ON public.conversations(business_id, status);
CREATE INDEX IF NOT EXISTS idx_conversations_last_customer_message_at ON public.conversations(last_customer_message_at);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_sent_at ON public.messages(conversation_id, sent_at);
CREATE INDEX IF NOT EXISTS idx_messages_provider_message_id ON public.messages(provider_message_id);
CREATE INDEX IF NOT EXISTS idx_leads_business_status ON public.leads(business_id, status);
CREATE INDEX IF NOT EXISTS idx_business_invitations_business_id ON public.business_invitations(business_id);
CREATE INDEX IF NOT EXISTS idx_business_invitations_email ON public.business_invitations(email);
CREATE INDEX IF NOT EXISTS idx_usage_events_business_id_created_at ON public.usage_events(business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_business_id_created_at ON public.audit_logs(business_id, created_at DESC);

INSERT INTO public.billing_subscriptions (business_id, provider, plan_key, status, seat_limit, monthly_message_limit)
SELECT b.id, 'manual', COALESCE(b.plan_key, 'starter'), 'trialing', COALESCE(b.seat_limit, 3), COALESCE(b.monthly_message_limit, 1000)
FROM public.businesses b
LEFT JOIN public.billing_subscriptions bs ON bs.business_id = b.id
WHERE bs.business_id IS NULL;

DROP TRIGGER IF EXISTS trg_businesses_set_updated_at ON public.businesses;
CREATE TRIGGER trg_businesses_set_updated_at
BEFORE UPDATE ON public.businesses
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_billing_subscriptions_set_updated_at ON public.billing_subscriptions;
CREATE TRIGGER trg_billing_subscriptions_set_updated_at
BEFORE UPDATE ON public.billing_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own membership" ON public.business_users;
DROP POLICY IF EXISTS "Service roles can insert memberships" ON public.business_users;
DROP POLICY IF EXISTS "Read own memberships" ON public.business_users;
DROP POLICY IF EXISTS "Service manages memberships" ON public.business_users;
CREATE POLICY "Read own memberships" ON public.business_users
FOR SELECT
USING (user_id = auth.uid());
CREATE POLICY "Service manages memberships" ON public.business_users
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can view associated businesses" ON public.businesses;
DROP POLICY IF EXISTS "Admins update business" ON public.businesses;
DROP POLICY IF EXISTS "Read associated businesses" ON public.businesses;
DROP POLICY IF EXISTS "Owner admin update businesses" ON public.businesses;
CREATE POLICY "Read associated businesses" ON public.businesses
FOR SELECT
USING (public.user_belongs_to_business(id));
CREATE POLICY "Owner admin update businesses" ON public.businesses
FOR UPDATE
USING (public.user_has_business_role(id, ARRAY['owner', 'admin']))
WITH CHECK (public.user_has_business_role(id, ARRAY['owner', 'admin']));

DROP POLICY IF EXISTS "Read business invitations" ON public.business_invitations;
DROP POLICY IF EXISTS "Service manages invitations" ON public.business_invitations;
CREATE POLICY "Read business invitations" ON public.business_invitations
FOR SELECT
USING (public.user_has_business_role(business_id, ARRAY['owner', 'admin']));
CREATE POLICY "Service manages invitations" ON public.business_invitations
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Access associated FAQs" ON public.faqs;
DROP POLICY IF EXISTS "Read FAQs for workspace" ON public.faqs;
DROP POLICY IF EXISTS "Owner admin insert FAQs" ON public.faqs;
DROP POLICY IF EXISTS "Owner admin update FAQs" ON public.faqs;
DROP POLICY IF EXISTS "Owner admin delete FAQs" ON public.faqs;
CREATE POLICY "Read FAQs for workspace" ON public.faqs
FOR SELECT
USING (public.user_belongs_to_business(business_id));
CREATE POLICY "Owner admin insert FAQs" ON public.faqs
FOR INSERT
WITH CHECK (public.user_has_business_role(business_id, ARRAY['owner', 'admin']));
CREATE POLICY "Owner admin update FAQs" ON public.faqs
FOR UPDATE
USING (public.user_has_business_role(business_id, ARRAY['owner', 'admin']))
WITH CHECK (public.user_has_business_role(business_id, ARRAY['owner', 'admin']));
CREATE POLICY "Owner admin delete FAQs" ON public.faqs
FOR DELETE
USING (public.user_has_business_role(business_id, ARRAY['owner', 'admin']));

DROP POLICY IF EXISTS "Access associated Conversations" ON public.conversations;
DROP POLICY IF EXISTS "Read conversations for workspace" ON public.conversations;
DROP POLICY IF EXISTS "Workspace members update conversations" ON public.conversations;
DROP POLICY IF EXISTS "Service manages conversations" ON public.conversations;
CREATE POLICY "Read conversations for workspace" ON public.conversations
FOR SELECT
USING (public.user_belongs_to_business(business_id));
CREATE POLICY "Workspace members update conversations" ON public.conversations
FOR UPDATE
USING (public.user_has_business_role(business_id, ARRAY['owner', 'admin', 'agent']))
WITH CHECK (public.user_has_business_role(business_id, ARRAY['owner', 'admin', 'agent']));
CREATE POLICY "Service manages conversations" ON public.conversations
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Access associated Messages" ON public.messages;
DROP POLICY IF EXISTS "Read messages for workspace" ON public.messages;
DROP POLICY IF EXISTS "Workspace members insert messages" ON public.messages;
CREATE POLICY "Read messages for workspace" ON public.messages
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM public.conversations c
        WHERE c.id = messages.conversation_id
          AND public.user_belongs_to_business(c.business_id)
    )
);
CREATE POLICY "Workspace members insert messages" ON public.messages
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.conversations c
        WHERE c.id = messages.conversation_id
          AND public.user_has_business_role(c.business_id, ARRAY['owner', 'admin', 'agent'])
    )
);

DROP POLICY IF EXISTS "Access associated Leads" ON public.leads;
DROP POLICY IF EXISTS "Read leads for workspace" ON public.leads;
DROP POLICY IF EXISTS "Workspace members insert leads" ON public.leads;
DROP POLICY IF EXISTS "Workspace members update leads" ON public.leads;
DROP POLICY IF EXISTS "Owner admin delete leads" ON public.leads;
CREATE POLICY "Read leads for workspace" ON public.leads
FOR SELECT
USING (public.user_belongs_to_business(business_id));
CREATE POLICY "Workspace members insert leads" ON public.leads
FOR INSERT
WITH CHECK (public.user_has_business_role(business_id, ARRAY['owner', 'admin', 'agent']));
CREATE POLICY "Workspace members update leads" ON public.leads
FOR UPDATE
USING (public.user_has_business_role(business_id, ARRAY['owner', 'admin', 'agent']))
WITH CHECK (public.user_has_business_role(business_id, ARRAY['owner', 'admin', 'agent']));
CREATE POLICY "Owner admin delete leads" ON public.leads
FOR DELETE
USING (public.user_has_business_role(business_id, ARRAY['owner', 'admin']));

DROP POLICY IF EXISTS "Owner admin read billing" ON public.billing_subscriptions;
DROP POLICY IF EXISTS "Service manages billing" ON public.billing_subscriptions;
CREATE POLICY "Owner admin read billing" ON public.billing_subscriptions
FOR SELECT
USING (public.user_has_business_role(business_id, ARRAY['owner', 'admin']));
CREATE POLICY "Service manages billing" ON public.billing_subscriptions
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Owner admin read usage" ON public.usage_events;
DROP POLICY IF EXISTS "Service inserts usage" ON public.usage_events;
CREATE POLICY "Owner admin read usage" ON public.usage_events
FOR SELECT
USING (public.user_has_business_role(business_id, ARRAY['owner', 'admin']));
CREATE POLICY "Service inserts usage" ON public.usage_events
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Owner admin read audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Service inserts audit logs" ON public.audit_logs;
CREATE POLICY "Owner admin read audit logs" ON public.audit_logs
FOR SELECT
USING (public.user_has_business_role(business_id, ARRAY['owner', 'admin']));
CREATE POLICY "Service inserts audit logs" ON public.audit_logs
FOR INSERT
WITH CHECK (auth.role() = 'service_role');
