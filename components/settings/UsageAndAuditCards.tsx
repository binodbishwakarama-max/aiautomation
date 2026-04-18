"use client";

import type { AuditLog, UsageEvent } from "@/lib/types";

interface UsageAndAuditCardsProps {
  usageEvents: UsageEvent[];
  auditLogs: AuditLog[];
}

export default function UsageAndAuditCards({ usageEvents, auditLogs }: UsageAndAuditCardsProps) {
  return (
    <section className="grid grid-cols-1 xl:grid-cols-2 gap-8">
      <div className="bg-surface border border-border p-6 rounded-card">
        <h2 className="text-lg font-bold text-textPrimary mb-4">Recent Usage</h2>
        <div className="space-y-3">
          {usageEvents.length === 0 ? (
            <div className="text-sm text-textMuted bg-background border border-border rounded-xl p-4">
              No metered usage events yet.
            </div>
          ) : (
            usageEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between gap-4 bg-background border border-border rounded-xl p-4"
              >
                <div>
                  <div className="text-sm font-semibold text-textPrimary">{event.event_type}</div>
                  <div className="text-xs text-textMuted">
                    {new Date(event.created_at).toLocaleString()}
                  </div>
                </div>
                <div className="text-sm font-semibold text-textPrimary">x{event.quantity}</div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-surface border border-border p-6 rounded-card">
        <h2 className="text-lg font-bold text-textPrimary mb-4">Audit Trail</h2>
        <div className="space-y-3">
          {auditLogs.length === 0 ? (
            <div className="text-sm text-textMuted bg-background border border-border rounded-xl p-4">
              No audit events recorded yet.
            </div>
          ) : (
            auditLogs.map((log) => (
              <div
                key={log.id}
                className="bg-background border border-border rounded-xl p-4"
              >
                <div className="text-sm font-semibold text-textPrimary">{log.action}</div>
                <div className="text-xs text-textMuted mt-1">
                  {log.entity_type}
                  {log.entity_id ? ` • ${log.entity_id}` : ""}
                </div>
                <div className="text-xs text-textMuted mt-2">
                  {new Date(log.created_at).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
