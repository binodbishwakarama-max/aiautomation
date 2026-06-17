"use client";

import { Shield, Wallet, AlertTriangle } from "lucide-react";

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
      <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-16 animate-pulse p-6">
        <div className="h-12 bg-white/[0.02] border border-border rounded-lg" />
        <div className="h-40 bg-white/[0.02] border border-border rounded-lg" />
        <div className="h-72 bg-white/[0.02] border border-border rounded-lg" />
        <div className="h-48 bg-white/[0.02] border border-border rounded-lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto p-6 pb-20">
      <FacebookSDKLoader />
      {/* Header + Save */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xs font-bold text-textPrimary uppercase tracking-wider mb-1">Configuration</h1>
          <p className="text-xs text-textMuted">
            Manage credentials, onboarding content, and workspace controls.
          </p>
        </div>

        <button
          onClick={form.saveSettings}
          disabled={form.savingSettings || !form.canManageWorkspace}
          className="px-4 py-2 bg-primary text-background font-bold rounded-lg hover:bg-primary/95 transition-colors text-xs self-start sm:self-auto shadow-none"
        >
          {form.savingSettings ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Setup Progress Banner */}
      {!form.storedAccessTokenLast4 && form.canManageWorkspace && (
        <section className="bg-amber-500/5 border border-amber-500/20 p-5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-amber-500 mt-0.5 shrink-0" size={18} />
            <div>
              <h3 className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-1">WhatsApp Not Configured</h3>
              <p className="text-xs text-amber-500/80 leading-relaxed">
                You cannot receive or send messages until you provide your Meta WhatsApp API credentials. Please fill out the WhatsApp Credentials section below.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Security Banner */}
      <section className="bg-[#0e0e14] border border-border p-5 rounded-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-textPrimary text-xs font-bold uppercase tracking-wider">
            <Shield size={14} className="text-primary" />
            Workspace Security
          </div>
          <p className="text-xs text-textMuted mt-1">
            Active workspace: <span className="text-textPrimary font-semibold">{form.activeWorkspace?.name}</span>. Your role is{" "}
            <span className="text-primary font-semibold capitalize">{form.role || "member"}</span>.
          </p>
        </div>

        {!form.canManageWorkspace && (
          <div className="px-3 py-1.5 rounded-lg bg-white/[0.01] border border-border text-xs text-textMuted select-none">
            This page is read-only for agents. Ask an owner or admin to rotate credentials.
          </div>
        )}
      </section>

      {/* Plan Summary */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#0e0e14] border border-border p-5 rounded-xl">
          <div className="flex items-center gap-1.5 text-textMuted font-bold text-[10px] uppercase tracking-wider mb-2">
            <Wallet size={12} className="text-primary/70" />
            Workspace Plan
          </div>
          <div className="text-lg font-bold text-textPrimary capitalize">
            {form.activeWorkspace?.planKey || "starter"}
          </div>
        </div>
        <div className="bg-[#0e0e14] border border-border p-5 rounded-xl">
          <div className="text-[10px] text-textMuted font-bold uppercase tracking-wider mb-2">Seat Limit</div>
          <div className="text-lg font-bold text-textPrimary">
            {form.activeWorkspace?.seatLimit || 0}
          </div>
        </div>
        <div className="bg-[#0e0e14] border border-border p-5 rounded-xl">
          <div className="text-[10px] text-textMuted font-bold uppercase tracking-wider mb-2">Monthly Messages</div>
          <div className="text-lg font-bold text-textPrimary">
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
