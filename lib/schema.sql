-- ----------------------------------------------------
-- ReplySync Supabase Database Schema
-- ----------------------------------------------------

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Businesses Table (Removed owner_id, abstracted to business_users)
CREATE TABLE public.businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    phone_number TEXT,
    whatsapp_number_id TEXT,
    whatsapp_access_token TEXT,
    business_type TEXT,
    city TEXT,
    follow_up_enabled BOOLEAN DEFAULT true,
    follow_up_message TEXT DEFAULT 'Hi! Just checking in — did you get all the information you needed? We''d love to help you get started. 😊',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Business Users Join Table
CREATE TABLE public.business_users (
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'admin', 'agent')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (business_id, user_id)
);
CREATE INDEX idx_business_users_user_id ON public.business_users(user_id);

-- 3. FAQs Table
CREATE TABLE public.faqs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Conversations Table
CREATE TABLE public.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    customer_phone TEXT NOT NULL,
    customer_name TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'escalated', 'followed_up')),
    last_message TEXT,
    last_message_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Messages Table
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Leads Table
CREATE TABLE public.leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'whatsapp',
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'enrolled', 'lost')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------
-- Secure RPC for Signup Pipeline
-- ----------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_business_with_owner(business_name TEXT, user_email TEXT)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE 
    NEW_B_ID UUID;
    CURRENT_USER_ID UUID;
BEGIN
    CURRENT_USER_ID := auth.uid();
    IF CURRENT_USER_ID IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Insert Business (optional nulls for whatsapp initially until onboarding)
    INSERT INTO public.businesses (name) 
    VALUES (business_name) 
    RETURNING id INTO NEW_B_ID;

    -- Insert mapping explicitly
    INSERT INTO public.business_users (business_id, user_id, role) 
    VALUES (NEW_B_ID, CURRENT_USER_ID, 'owner');
    
    RETURN NEW_B_ID;
END;
$$;

-- ----------------------------------------------------
-- Row Level Security (RLS) Policies
-- ----------------------------------------------------

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- business_users policies
CREATE POLICY "Users can view their own membership" ON public.business_users FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Service roles can insert memberships" ON public.business_users FOR INSERT WITH CHECK (auth.role() = 'service_role'); -- Users use RPC to insert

-- businesses policies
CREATE POLICY "Users can view associated businesses" ON public.businesses FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.business_users WHERE business_id = businesses.id AND user_id = auth.uid())
);
CREATE POLICY "Admins update business" ON public.businesses FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.business_users WHERE business_id = businesses.id AND user_id = auth.uid() AND role IN ('owner', 'admin'))
);

-- Child tables policies (abstract matching)
CREATE POLICY "Access associated FAQs" ON public.faqs FOR ALL USING (
    EXISTS (SELECT 1 FROM public.business_users WHERE business_id = faqs.business_id AND user_id = auth.uid())
);
CREATE POLICY "Access associated Conversations" ON public.conversations FOR ALL USING (
    EXISTS (SELECT 1 FROM public.business_users WHERE business_id = conversations.business_id AND user_id = auth.uid())
);
CREATE POLICY "Access associated Leads" ON public.leads FOR ALL USING (
    EXISTS (SELECT 1 FROM public.business_users WHERE business_id = leads.business_id AND user_id = auth.uid())
);
-- messages check implicitly via conversation mapping to business
CREATE POLICY "Access associated Messages" ON public.messages FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.conversations c 
        JOIN public.business_users bu ON bu.business_id = c.business_id 
        WHERE c.id = messages.conversation_id AND bu.user_id = auth.uid()
    )
);
