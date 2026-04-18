"use client";

import { Shield, Wallet, AlertTriangle } from "lucide-react";

import BusinessProfileCard from "@/components/settings/BusinessProfileCard";
import WhatsAppCredentialsCard from "@/components/settings/WhatsAppCredentialsCard";
import FollowUpConfigCard from "@/components/settings/FollowUpConfigCard";
import FaqManager from "@/components/settings/FaqManager";
import BillingSnapshotCard from "@/components/settings/BillingSnapshotCard";
import UsageAndAuditCards from "@/components/settings/UsageAndAuditCards";
import { useSettingsForm } from "@/hooks/useSettingsForm";

export default function SettingsPage() {
  const form = useSettingsForm();

  if (form.loading) {
    return (
      <div className="flex flex-col gap-8 max-w-5xl mx-auto pb-16 animate-pulse">
        <div className="h-16 bg-surface rounded-card border border-border" />
        <div className="h-56 bg-surface rounded-card border border-border" />
        <div className="h-96 bg-surface rounded-card border border-border" />
        <div className="h-72 bg-surface rounded-card border border-border" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto pb-16">
      {/* Header + Save */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-textPrimary mb-2">Configuration</h1>
          <p className="text-sm text-textMuted">
            Manage tenant-safe credentials, onboarding content, and workspace controls.
          </p>
        </div>

        <button
          onClick={form.saveSettings}
          disabled={form.savingSettings || !form.canManageWorkspace}
          className="px-6 py-2.5 bg-primary text-background font-bold rounded-xl shadow-glow-primary hover:bg-opacity-90 disabled:opacity-50 transition-all"
        >
          {form.savingSettings ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Setup Progress Banner */}
      {!form.storedAccessTokenLast4 && form.canManageWorkspace && (
        <section className="bg-amber-500/10 border border-amber-500/30 p-5 rounded-card flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-amber-500 mt-0.5 shrink-0" size={20} />
            <div>
              <h3 className="font-bold text-amber-500 mb-1">WhatsApp Not Configured</h3>
              <p className="text-sm text-amber-500/80">
                You cannot receive or send messages until you provide your Meta WhatsApp API credentials. Please fill out the WhatsApp Credentials section below.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Security Banner */}
      <section className="bg-surface border border-border p-5 rounded-card flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-textPrimary font-semibold">
            <Shield size={18} className="text-primary" />
            Workspace Security
          </div>
          <p className="text-sm text-textMuted mt-1">
            Active workspace: {form.activeWorkspace?.name}. Your role is{" "}
            <span className="text-textPrimary capitalize">{form.role || "member"}</span>.
          </p>
        </div>

        {!form.canManageWorkspace && (
          <div className="px-4 py-3 rounded-xl bg-background border border-border text-sm text-textMuted">
            This page is read-only for agents. Ask an owner or admin to rotate credentials.
          </div>
        )}
      </section>

      {/* Plan Summary */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface border border-border p-5 rounded-card">
          <div className="flex items-center gap-2 text-textPrimary font-semibold mb-2">
            <Wallet size={18} className="text-primary" />
            Plan
          </div>
          <div className="text-2xl font-bold text-textPrimary capitalize">
            {form.activeWorkspace?.planKey || "starter"}
          </div>
        </div>
        <div className="bg-surface border border-border p-5 rounded-card">
          <div className="text-sm text-textMuted mb-2">Seat limit</div>
          <div className="text-2xl font-bold text-textPrimary">
            {form.activeWorkspace?.seatLimit || 0}
          </div>
        </div>
        <div className="bg-surface border border-border p-5 rounded-card">
          <div className="text-sm text-textMuted mb-2">Monthly message limit</div>
          <div className="text-2xl font-bold text-textPrimary">
            {form.activeWorkspace?.monthlyMessageLimit || 0}
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
