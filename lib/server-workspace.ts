import { User } from '@supabase/supabase-js';

import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import type { BusinessRole, WorkspaceMembership } from '@/lib/types';
import { decryptSecret, encryptSecret, last4 } from '@/lib/crypto';

export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function normalizeWorkspaceName(input?: string | null) {
  const cleaned = input?.trim();
  return cleaned && cleaned.length > 0 ? cleaned : 'My Workspace';
}

export async function getAuthenticatedUserOrThrow() {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new HttpError(401, 'Unauthorized');
  }

  return { supabase, user };
}

export async function ensureWorkspaceForUser(user: User) {
  const { data: existingMembership } = await supabaseAdmin
    .from('business_users')
    .select('business_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existingMembership?.business_id) {
    return existingMembership.business_id;
  }

  const defaultWorkspaceName = normalizeWorkspaceName(
    typeof user.user_metadata?.business_name === 'string'
      ? user.user_metadata.business_name
      : typeof user.user_metadata?.name === 'string'
        ? `${user.user_metadata.name}'s Workspace`
        : null
  );

  const { data: business, error: businessError } = await supabaseAdmin
    .from('businesses')
    .insert({
      name: defaultWorkspaceName,
    })
    .select('id')
    .single();

  if (businessError || !business) {
    throw new HttpError(500, businessError?.message || 'Failed to create workspace');
  }

  const { error: membershipError } = await supabaseAdmin.from('business_users').insert({
    business_id: business.id,
    user_id: user.id,
    role: 'owner',
  });

  if (membershipError) {
    throw new HttpError(500, membershipError.message);
  }

  await supabaseAdmin.from('billing_subscriptions').upsert(
    {
      business_id: business.id,
      plan_key: 'starter',
      status: 'trialing',
      seat_limit: 3,
      monthly_message_limit: 1000,
    },
    { onConflict: 'business_id' }
  );

  return business.id;
}

export async function listWorkspacesForUser(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('business_users')
    .select('business_id, user_id, role, created_at, businesses(id, name, plan_key, seat_limit, monthly_message_limit)')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new HttpError(500, error.message);
  }

  return (data || []) as unknown as WorkspaceMembership[];
}

export async function getWorkspaceMembershipOrThrow(
  workspaceId: string,
  allowedRoles?: BusinessRole[]
) {
  const { user } = await getAuthenticatedUserOrThrow();

  await ensureWorkspaceForUser(user);

  const { data: membership, error } = await supabaseAdmin
    .from('business_users')
    .select('business_id, user_id, role, created_at, businesses(id, name, plan_key, seat_limit, monthly_message_limit)')
    .eq('business_id', workspaceId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    throw new HttpError(500, error.message);
  }

  if (!membership) {
    throw new HttpError(403, 'Workspace access denied');
  }

  if (allowedRoles && !allowedRoles.includes(membership.role as BusinessRole)) {
    throw new HttpError(403, 'Insufficient permissions');
  }

  return {
    user,
    membership: membership as unknown as WorkspaceMembership,
  };
}

export async function getConversationAccessOrThrow(
  conversationId: string,
  allowedRoles?: BusinessRole[]
) {
  const { user } = await getAuthenticatedUserOrThrow();

  const { data: conversation, error } = await supabaseAdmin
    .from('conversations')
    .select('id, business_id, customer_phone, customer_name, status, last_message, last_message_at, last_customer_message_at, last_outbound_message_at, created_at')
    .eq('id', conversationId)
    .maybeSingle();

  if (error) {
    throw new HttpError(500, error.message);
  }

  if (!conversation) {
    throw new HttpError(404, 'Conversation not found');
  }

  const { data: membership, error: membershipError } = await supabaseAdmin
    .from('business_users')
    .select('business_id, user_id, role, created_at')
    .eq('business_id', conversation.business_id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (membershipError) {
    throw new HttpError(500, membershipError.message);
  }

  if (!membership) {
    throw new HttpError(403, 'Conversation access denied');
  }

  if (allowedRoles && !allowedRoles.includes(membership.role as BusinessRole)) {
    throw new HttpError(403, 'Insufficient permissions');
  }

  return {
    user,
    membership: membership as WorkspaceMembership,
    conversation,
  };
}

export async function getWorkspaceSecretsOrThrow(workspaceId: string) {
  const { data: business, error } = await supabaseAdmin
    .from('businesses')
    .select('id, whatsapp_number_id, whatsapp_access_token_encrypted, whatsapp_access_token_last4, whatsapp_app_secret_encrypted, whatsapp_app_secret_last4, follow_up_enabled, follow_up_template_name, follow_up_template_language_code, follow_up_template_variables')
    .eq('id', workspaceId)
    .maybeSingle();

  if (error) {
    throw new HttpError(500, error.message);
  }

  if (!business) {
    throw new HttpError(404, 'Workspace not found');
  }

  return {
    id: business.id,
    whatsappNumberId: business.whatsapp_number_id,
    accessToken: decryptSecret(business.whatsapp_access_token_encrypted),
    accessTokenLast4: business.whatsapp_access_token_last4,
    appSecret: decryptSecret(business.whatsapp_app_secret_encrypted),
    appSecretLast4: business.whatsapp_app_secret_last4,
    followUpEnabled: business.follow_up_enabled,
    followUpTemplateName: business.follow_up_template_name,
    followUpTemplateLanguageCode: business.follow_up_template_language_code,
    followUpTemplateVariables: Array.isArray(business.follow_up_template_variables)
      ? business.follow_up_template_variables
      : [],
  };
}

export async function updateWorkspaceSecrets(
  workspaceId: string,
  values: {
    whatsappNumberId?: string | null;
    accessToken?: string | null;
    clearAccessToken?: boolean;
    appSecret?: string | null;
    clearAppSecret?: boolean;
    followUpEnabled?: boolean;
    followUpTemplateName?: string | null;
    followUpTemplateLanguageCode?: string | null;
    followUpTemplateVariables?: string[];
  }
) {
  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (values.whatsappNumberId !== undefined) {
    updatePayload.whatsapp_number_id = values.whatsappNumberId?.trim() || null;
  }

  if (values.clearAccessToken) {
    updatePayload.whatsapp_access_token_encrypted = null;
    updatePayload.whatsapp_access_token_last4 = null;
  } else if (values.accessToken && values.accessToken.trim()) {
    updatePayload.whatsapp_access_token_encrypted = encryptSecret(values.accessToken);
    updatePayload.whatsapp_access_token_last4 = last4(values.accessToken);
  }

  if (values.clearAppSecret) {
    updatePayload.whatsapp_app_secret_encrypted = null;
    updatePayload.whatsapp_app_secret_last4 = null;
  } else if (values.appSecret && values.appSecret.trim()) {
    updatePayload.whatsapp_app_secret_encrypted = encryptSecret(values.appSecret);
    updatePayload.whatsapp_app_secret_last4 = last4(values.appSecret);
  }

  if (values.followUpEnabled !== undefined) {
    updatePayload.follow_up_enabled = values.followUpEnabled;
  }

  if (values.followUpTemplateName !== undefined) {
    updatePayload.follow_up_template_name = values.followUpTemplateName?.trim() || null;
  }

  if (values.followUpTemplateLanguageCode !== undefined) {
    updatePayload.follow_up_template_language_code =
      values.followUpTemplateLanguageCode?.trim() || 'en_US';
  }

  if (values.followUpTemplateVariables !== undefined) {
    updatePayload.follow_up_template_variables = values.followUpTemplateVariables;
  }

  const { error } = await supabaseAdmin
    .from('businesses')
    .update(updatePayload)
    .eq('id', workspaceId);

  if (error) {
    throw new HttpError(500, error.message);
  }
}
