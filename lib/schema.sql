-- ----------------------------------------------------
-- ReplySync Supabase Database Schema
-- SaaS-hardened baseline
-- ----------------------------------------------------

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------
-- Shared helpers
-- ----------------------------------------------------

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

-- ----------------------------------------------------
-- Core SaaS tables
-- ----------------------------------------------------

CREATE TABLE public.businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    phone_number TEXT,
    whatsapp_number_id TEXT,
    whatsapp_access_token_encrypted TEXT,
    whatsapp_access_token_last4 TEXT,
    whatsapp_app_secret_encrypted TEXT,
    whatsapp_app_secret_last4 TEXT,
    business_type TEXT,
    city TEXT,
    plan_key TEXT NOT NULL DEFAULT 'starter',
    seat_limit INTEGER NOT NULL DEFAULT 3 CHECK (seat_limit > 0),
    monthly_message_limit INTEGER NOT NULL DEFAULT 1000 CHECK (monthly_message_limit >= 0),
    follow_up_enabled BOOLEAN NOT NULL DEFAULT false,
    follow_up_template_name TEXT,
    follow_up_template_language_code TEXT DEFAULT 'en_US',
    follow_up_template_variables JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_businesses_plan_key ON public.businesses(plan_key);
CREATE INDEX idx_businesses_whatsapp_number_id ON public.businesses(whatsapp_number_id);

CREATE TABLE public.business_users (
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'admin', 'agent')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (business_id, user_id)
);
CREATE INDEX idx_business_users_user_id ON public.business_users(user_id);

CREATE TABLE public.business_invitations (
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
CREATE INDEX idx_business_invitations_business_id ON public.business_invitations(business_id);
CREATE INDEX idx_business_invitations_email ON public.business_invitations(email);

CREATE TABLE public.faqs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_faqs_business_id_order ON public.faqs(business_id, display_order, created_at);

CREATE TABLE public.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    customer_phone TEXT NOT NULL,
    customer_name TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'escalated', 'followed_up')),
    last_message TEXT,
    last_message_at TIMESTAMPTZ,
    last_customer_message_at TIMESTAMPTZ,
    last_outbound_message_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (business_id, customer_phone)
);
CREATE INDEX idx_conversations_business_status ON public.conversations(business_id, status);
CREATE INDEX idx_conversations_last_customer_message_at ON public.conversations(last_customer_message_at);

CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    direction TEXT NOT NULL DEFAULT 'inbound' CHECK (direction IN ('inbound', 'outbound', 'internal')),
    content TEXT NOT NULL,
    provider_message_id TEXT UNIQUE,
    message_type TEXT NOT NULL DEFAULT 'text',
    sender_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_messages_conversation_sent_at ON public.messages(conversation_id, sent_at);
CREATE INDEX idx_messages_provider_message_id ON public.messages(provider_message_id);

CREATE TABLE public.leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'whatsapp',
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'enrolled', 'lost')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (business_id, phone)
);
CREATE INDEX idx_leads_business_status ON public.leads(business_id, status);

CREATE TABLE public.billing_subscriptions (
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

CREATE TABLE public.usage_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_usage_events_business_id_created_at ON public.usage_events(business_id, created_at DESC);

CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_audit_logs_business_id_created_at ON public.audit_logs(business_id, created_at DESC);

CREATE TABLE public.rate_limit_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_rate_limit_entries_key_created_at ON public.rate_limit_entries(key, created_at DESC);

CREATE TRIGGER trg_businesses_set_updated_at
BEFORE UPDATE ON public.businesses
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_billing_subscriptions_set_updated_at
BEFORE UPDATE ON public.billing_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------

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

CREATE POLICY "Read own memberships" ON public.business_users
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Service manages memberships" ON public.business_users
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Read associated businesses" ON public.businesses
FOR SELECT
USING (public.user_belongs_to_business(id));

CREATE POLICY "Owner admin update businesses" ON public.businesses
FOR UPDATE
USING (public.user_has_business_role(id, ARRAY['owner', 'admin']))
WITH CHECK (public.user_has_business_role(id, ARRAY['owner', 'admin']));

CREATE POLICY "Read business invitations" ON public.business_invitations
FOR SELECT
USING (public.user_has_business_role(business_id, ARRAY['owner', 'admin']));

CREATE POLICY "Service manages invitations" ON public.business_invitations
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

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

CREATE POLICY "Owner admin read billing" ON public.billing_subscriptions
FOR SELECT
USING (public.user_has_business_role(business_id, ARRAY['owner', 'admin']));

CREATE POLICY "Service manages billing" ON public.billing_subscriptions
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Owner admin read usage" ON public.usage_events
FOR SELECT
USING (public.user_has_business_role(business_id, ARRAY['owner', 'admin']));

CREATE POLICY "Service inserts usage" ON public.usage_events
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Owner admin read audit logs" ON public.audit_logs
FOR SELECT
USING (public.user_has_business_role(business_id, ARRAY['owner', 'admin']));

CREATE POLICY "Service inserts audit logs" ON public.audit_logs
FOR INSERT
WITH CHECK (auth.role() = 'service_role');
