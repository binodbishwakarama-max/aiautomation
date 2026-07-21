"use client";

import { Shield, Wallet, AlertTriangle, Save } from "lucide-react";

import BusinessProfileCard from "@/components/settings/BusinessProfileCard";
import WhatsAppCredentialsCard from "@/components/settings/WhatsAppCredentialsCard";
import FollowUpConfigCard from "@/components/settings/FollowUpConfigCard";
import FaqManager from "@/components/settings/FaqManager";
import BillingSnapshotCard from "@/components/settings/BillingSnapshotCard";
import UsageAndAuditCards from "@/components/settings/UsageAndAuditCards";
import FacebookSDKLoader from "@/components/settings/FacebookSDKLoader";
import { useSettingsForm } from "@/hooks/useSettingsForm";

export default function SettingsPage() {
  const form = useSettingsForm();

  if (form.loading) {
    return (
      <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-24 animate-pulse p-6">
        <div className="h-10 bg-surface/50 border border-border rounded-2xl w-1/3" />
        <div className="h-32 bg-surface/50 border border-border rounded-2xl" />
        <div className="h-64 bg-surface/50 border border-border rounded-2xl" />
        <div className="h-48 bg-surface/50 border border-border rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto p-6 pb-24 select-none">
      <FacebookSDKLoader />
      
      {/* Header & Save Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gradient">
            Workspace & AI Configuration
          </h1>
          <p className="text-xs text-textMuted mt-0.5">
            Configure Meta WhatsApp API credentials, custom FAQ RAG rules, and team permissions.
          </p>
        </div>

        <button
          onClick={form.saveSettings}
          disabled={form.savingSettings || !form.canManageWorkspace}
          className="btn-primary text-xs font-bold shrink-0 shadow-glow-primary"
        >
          <Save size={14} />
          <span>{form.savingSettings ? "Saving Settings..." : "Save Configuration"}</span>
        </button>
      </div>

      {/* WhatsApp Alert Banner */}
      {!form.storedAccessTokenLast4 && form.canManageWorkspace && (
        <section className="glass-card p-5 rounded-2xl border border-amber-500/30 bg-amber-500/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-amber-400 mt-0.5 shrink-0" size={20} />
            <div>
              <h3 className="text-xs font-bold text-amber-400 uppercase font-mono tracking-wider mb-1">
                WhatsApp API Unconfigured
              </h3>
              <p className="text-xs text-textMuted leading-relaxed">
                Connect your Meta Developer WhatsApp App Phone Number ID and Access Token to start processing real-time messages.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Security & Access Banner */}
      <section className="glass-card p-5 rounded-2xl border border-border flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-textPrimary text-xs font-bold uppercase font-mono tracking-wider">
            <Shield size={14} className="text-accent" />
            Row Level Security (RLS) Vault
          </div>
          <p className="text-xs text-textMuted mt-1">
            Active workspace: <span className="text-textPrimary font-semibold font-mono">{form.activeWorkspace?.name}</span>. Access Role:{" "}
            <span className="text-accent font-semibold font-mono uppercase text-[10px] bg-accent/10 px-2 py-0.5 rounded border border-accent/20">
              {form.role || "owner"}
            </span>
          </p>
        </div>

        {!form.canManageWorkspace && (
          <div className="px-3 py-1.5 rounded-xl bg-surface border border-border text-xs font-mono text-textMuted select-none">
            Read-only mode for agent role.
          </div>
        )}
      </section>

      {/* Workspace Plan Metrics */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card border border-border p-5 rounded-2xl">
          <div className="flex items-center gap-2 text-textMuted font-mono text-[10px] font-bold uppercase tracking-wider mb-2">
            <Wallet size={12} className="text-accent" />
            Current Tier
          </div>
          <div className="text-xl font-extrabold text-textPrimary capitalize font-sans">
            {form.activeWorkspace?.planKey || "starter"}
          </div>
        </div>
        <div className="glass-card border border-border p-5 rounded-2xl">
          <div className="text-[10px] font-mono text-textMuted font-bold uppercase tracking-wider mb-2">Team Seats Limit</div>
          <div className="text-xl font-extrabold text-textPrimary font-sans">
            {form.activeWorkspace?.seatLimit || 0} Seats
          </div>
        </div>
        <div className="glass-card border border-border p-5 rounded-2xl">
          <div className="text-[10px] font-mono text-textMuted font-bold uppercase tracking-wider mb-2">Monthly Message Quota</div>
          <div className="text-xl font-extrabold text-accent font-sans">
            {form.activeWorkspace?.monthlyMessageLimit || 0} Msgs
          </div>
        </div>
      </section>

      {/* Billing */}
      {form.canManageWorkspace && (
        <BillingSnapshotCard billingSubscription={form.billingSubscription} />
      )}

      {/* Business Profile */}
      <BusinessProfileCard
        name={form.name}
        setName={form.setName}
        businessType={form.businessType}
        setBusinessType={form.setBusinessType}
        phoneNumber={form.phoneNumber}
        setPhoneNumber={form.setPhoneNumber}
        disabled={!form.canManageWorkspace}
      />

      {/* WhatsApp Credentials */}
      <WhatsAppCredentialsCard
        workspaceId={form.activeWorkspaceId || ""}
        whatsappNumberId={form.whatsappNumberId}
        setWhatsappNumberId={form.setWhatsappNumberId}
        storedAccessTokenLast4={form.storedAccessTokenLast4}
        storedAppSecretLast4={form.storedAppSecretLast4}
        whatsappAccessTokenInput={form.whatsappAccessTokenInput}
        setWhatsappAccessTokenInput={form.setWhatsappAccessTokenInput}
        whatsappAppSecretInput={form.whatsappAppSecretInput}
        setWhatsappAppSecretInput={form.setWhatsappAppSecretInput}
        clearStoredAccessToken={form.clearStoredAccessToken}
        setClearStoredAccessToken={form.setClearStoredAccessToken}
        clearStoredAppSecret={form.clearStoredAppSecret}
        setClearStoredAppSecret={form.setClearStoredAppSecret}
        webhookURL={form.webhookURL}
        verifyToken={form.verifyToken}
        connectionStatus={form.connectionStatus}
        testingConnection={form.testingConnection}
        disabled={!form.canManageWorkspace}
        onTestConnection={form.testConnection}
        onCopyToClipboard={form.copyToClipboard}
      />

      {/* Follow-up */}
      <FollowUpConfigCard
        followUpEnabled={form.followUpEnabled}
        setFollowUpEnabled={form.setFollowUpEnabled}
        followUpTemplateName={form.followUpTemplateName}
        setFollowUpTemplateName={form.setFollowUpTemplateName}
        followUpTemplateLanguageCode={form.followUpTemplateLanguageCode}
        setFollowUpTemplateLanguageCode={form.setFollowUpTemplateLanguageCode}
        followUpTemplateVariables={form.followUpTemplateVariables}
        setFollowUpTemplateVariables={form.setFollowUpTemplateVariables}
        disabled={!form.canManageWorkspace}
      />

      {/* FAQ Manager */}
      <FaqManager
        faqs={form.faqs}
        disabled={!form.canManageWorkspace}
        addFaq={form.addFaq}
        updateFaq={form.updateFaq}
        removeFaq={form.removeFaq}
        reorderFaqs={form.reorderFaqs}
      />

      {/* Usage & Audit */}
      {form.canManageWorkspace && (
        <UsageAndAuditCards
          usageEvents={form.usageEvents}
          auditLogs={form.auditLogs}
        />
      )}
    </div>
  );
}
