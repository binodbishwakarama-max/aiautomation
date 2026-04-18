"use client";

import { Wallet } from "lucide-react";
import type { BillingSubscription } from "@/lib/types";

interface BillingSnapshotCardProps {
  billingSubscription: BillingSubscription | null;
}

export default function BillingSnapshotCard({ billingSubscription }: BillingSnapshotCardProps) {
  return (
    <section className="bg-surface border border-border p-6 rounded-card">
      <h2 className="text-lg font-bold text-textPrimary flex items-center gap-2 mb-6">
        <Wallet size={18} className="text-primary" /> Billing Snapshot
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-background border border-border rounded-xl p-4">
          <div className="text-xs uppercase tracking-[0.24em] text-textMuted mb-2">Status</div>
          <div className="text-lg font-semibold text-textPrimary capitalize">
            {billingSubscription?.status || "trialing"}
          </div>
        </div>
        <div className="bg-background border border-border rounded-xl p-4">
          <div className="text-xs uppercase tracking-[0.24em] text-textMuted mb-2">Provider</div>
          <div className="text-lg font-semibold text-textPrimary capitalize">
            {billingSubscription?.provider || "manual"}
          </div>
        </div>
        <div className="bg-background border border-border rounded-xl p-4">
          <div className="text-xs uppercase tracking-[0.24em] text-textMuted mb-2">Period Start</div>
          <div className="text-sm font-semibold text-textPrimary">
            {billingSubscription?.current_period_start
              ? new Date(billingSubscription.current_period_start).toLocaleDateString()
              : "Not set"}
          </div>
        </div>
        <div className="bg-background border border-border rounded-xl p-4">
          <div className="text-xs uppercase tracking-[0.24em] text-textMuted mb-2">Period End</div>
          <div className="text-sm font-semibold text-textPrimary">
            {billingSubscription?.current_period_end
              ? new Date(billingSubscription.current_period_end).toLocaleDateString()
              : "Not set"}
          </div>
        </div>
      </div>
    </section>
  );
}
