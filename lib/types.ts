export type BusinessRole = 'owner' | 'admin' | 'agent';
export type LeadStatus = 'new' | 'contacted' | 'enrolled' | 'lost';
export type ConversationStatus = 'active' | 'resolved' | 'escalated' | 'followed_up';
export type MessageDirection = 'inbound' | 'outbound' | 'internal';
export type BillingStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'incomplete';

export interface Business {
  id: string;
  name: string;
  slug: string | null;
  phone_number: string | null;
  whatsapp_number_id: string | null;
  whatsapp_access_token_last4: string | null;
  whatsapp_app_secret_last4: string | null;
  business_type: string | null;
  city: string | null;
  plan_key: string;
  seat_limit: number;
  monthly_message_limit: number;
  follow_up_enabled: boolean;
  follow_up_template_name: string | null;
  follow_up_template_language_code: string | null;
  follow_up_template_variables: string[];
  created_at: string;
  updated_at: string;
}

export interface WorkspaceMembership {
  business_id: string;
  user_id: string;
  role: BusinessRole;
  created_at: string;
  businesses?: {
    id: string;
    name: string;
    plan_key: string;
    seat_limit: number;
    monthly_message_limit: number;
  } | null;
}

export interface FAQ {
  id: string;
  business_id: string;
  question: string;
  answer: string;
  display_order?: number;
  created_at?: string;
}

export interface Conversation {
  id: string;
  business_id: string;
  customer_phone: string;
  customer_name: string | null;
  status: ConversationStatus;
  last_message: string | null;
  last_message_at: string | null;
  last_customer_message_at?: string | null;
  last_outbound_message_at?: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  direction: MessageDirection;
  content: string;
  provider_message_id?: string | null;
  message_type?: string;
  sender_user_id?: string | null;
  metadata?: Record<string, unknown>;
  sent_at: string;
}

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

export interface BillingSubscription {
  id: string;
  business_id: string;
  provider: string;
  provider_customer_id: string | null;
  provider_subscription_id: string | null;
  plan_key: string;
  status: BillingStatus;
  seat_limit: number;
  monthly_message_limit: number;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface UsageEvent {
  id: string;
  business_id: string;
  event_type: string;
  quantity: number;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface AuditLog {
  id: string;
  business_id: string;
  actor_user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}
