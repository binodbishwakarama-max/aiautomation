import { logger } from '@/lib/logger';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function recordUsageEvent(params: {
  businessId: string;
  eventType: string;
  quantity?: number;
  metadata?: Record<string, unknown>;
}) {
  const { businessId, eventType, quantity = 1, metadata = {} } = params;

  const { error } = await supabaseAdmin.from('usage_events').insert({
    business_id: businessId,
    event_type: eventType,
    quantity,
    metadata,
  });

  if (error) {
    logger.error('Failed to record usage event', { businessId, eventType, error: error.message });
  }
}

export async function writeAuditLog(params: {
  businessId: string;
  actorUserId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const { businessId, actorUserId = null, action, entityType, entityId = null, metadata = {} } = params;

  const { error } = await supabaseAdmin.from('audit_logs').insert({
    business_id: businessId,
    actor_user_id: actorUserId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    metadata,
  });

  if (error) {
    logger.error('Failed to write audit log', { businessId, action, error: error.message });
  }
}
