// Database types — derived from lib/schema.sql
// Replace with `npx supabase gen types typescript` for auto-generated types when connected.

export interface Business {
  id: string;
  name: string;
  phone_number: string | null;
  whatsapp_number_id: string | null;
  whatsapp_access_token: string | null;
  business_type: string | null;
  city: string | null;
  follow_up_enabled: boolean;
  follow_up_message: string | null;
  created_at: string;
}

export interface BusinessUser {
  business_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'agent';
  created_at: string;
}

export interface FAQ {
  id: string;
  business_id: string;
  question: string;
  answer: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  business_id: string;
  customer_phone: string;
  customer_name: string | null;
  status: 'active' | 'resolved' | 'escalated' | 'followed_up';
  last_message: string | null;
  last_message_at: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  sent_at: string;
}

export type LeadStatus = 'new' | 'contacted' | 'enrolled' | 'lost';

export interface Lead {
  id: string;
  business_id: string;
  name: string;
  phone: string;
  source: string;
  status: LeadStatus;
  notes: string | null;
  created_at: string;
}
