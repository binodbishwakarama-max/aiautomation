"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useToast } from "@/components/ui/ToastProvider";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { createClient } from "@/lib/supabase/client";
import type { AuditLog, BillingSubscription, FAQ, UsageEvent } from "@/lib/types";

export function useSettingsForm() {
  const {
    activeWorkspace,
    activeWorkspaceId,
    canManageWorkspace,
    loading: workspaceLoading,
    role,
  } = useWorkspace();

  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "success" | "error">("idle");

  // Business profile
  const [name, setName] = useState("");
  const [businessType, setBusinessType] = useState("other");
  const [phoneNumber, setPhoneNumber] = useState("");

  // WhatsApp credentials
  const [whatsappNumberId, setWhatsappNumberId] = useState("");
  const [storedAccessTokenLast4, setStoredAccessTokenLast4] = useState<string | null>(null);
  const [storedAppSecretLast4, setStoredAppSecretLast4] = useState<string | null>(null);
  const [whatsappAccessTokenInput, setWhatsappAccessTokenInput] = useState("");
  const [whatsappAppSecretInput, setWhatsappAppSecretInput] = useState("");
  const [clearStoredAccessToken, setClearStoredAccessToken] = useState(false);
  const [clearStoredAppSecret, setClearStoredAppSecret] = useState(false);

  // Follow-up
  const [followUpEnabled, setFollowUpEnabled] = useState(false);
  const [followUpTemplateName, setFollowUpTemplateName] = useState("");
  const [followUpTemplateLanguageCode, setFollowUpTemplateLanguageCode] = useState("en_US");
  const [followUpTemplateVariables, setFollowUpTemplateVariables] = useState("");

  // Data
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [billingSubscription, setBillingSubscription] = useState<BillingSubscription | null>(null);
  const [usageEvents, setUsageEvents] = useState<UsageEvent[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const { success, error } = useToast();

  const verifyToken =
    process.env.NEXT_PUBLIC_META_VERIFY_TOKEN || "replysync_secure_webhook_token_123";
  const webhookURL =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/webhook`
      : "https://yourdomain.com/api/webhook";

  const followUpVariablesList = useMemo(
    () =>
      followUpTemplateVariables
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean),
    [followUpTemplateVariables]
  );

  // ── Fetch settings ──────────────────────────────────────────────

  useEffect(() => {
    async function fetchSettings() {
      if (!activeWorkspaceId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const supabase = createClient();

      const { data: businessData, error: businessError } = await supabase
        .from("businesses")
        .select(
          "id, name, business_type, phone_number, whatsapp_number_id, whatsapp_access_token_last4, whatsapp_app_secret_last4, follow_up_enabled, follow_up_template_name, follow_up_template_language_code, follow_up_template_variables"
        )
        .eq("id", activeWorkspaceId)
        .single();

      if (businessError) {
        console.error(businessError);
        error("Failed to load workspace settings");
        setLoading(false);
        return;
      }

      setName(businessData.name || "");
      setBusinessType(businessData.business_type || "other");
      setPhoneNumber(businessData.phone_number || "");
      setWhatsappNumberId(businessData.whatsapp_number_id || "");
      setStoredAccessTokenLast4(businessData.whatsapp_access_token_last4 || null);
      setStoredAppSecretLast4(businessData.whatsapp_app_secret_last4 || null);
      setFollowUpEnabled(Boolean(businessData.follow_up_enabled));
      setFollowUpTemplateName(businessData.follow_up_template_name || "");
      setFollowUpTemplateLanguageCode(
        businessData.follow_up_template_language_code || "en_US"
      );
      setFollowUpTemplateVariables(
        Array.isArray(businessData.follow_up_template_variables)
          ? businessData.follow_up_template_variables.join(", ")
          : ""
      );

      const { data: faqsData, error: faqsError } = await supabase
        .from("faqs")
        .select("id, business_id, question, answer, display_order, created_at")
        .eq("business_id", activeWorkspaceId)
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (faqsError) {
        console.error(faqsError);
        error("Failed to load FAQs");
      } else {
        setFaqs((faqsData || []) as FAQ[]);
      }

      if (canManageWorkspace) {
        const [{ data: billingData }, { data: usageData }, { data: auditData }] =
          await Promise.all([
            supabase
              .from("billing_subscriptions")
              .select("*")
              .eq("business_id", activeWorkspaceId)
              .maybeSingle(),
            supabase
              .from("usage_events")
              .select("*")
              .eq("business_id", activeWorkspaceId)
              .order("created_at", { ascending: false })
              .limit(8),
            supabase
              .from("audit_logs")
              .select("*")
              .eq("business_id", activeWorkspaceId)
              .order("created_at", { ascending: false })
              .limit(8),
          ]);

        setBillingSubscription((billingData || null) as BillingSubscription | null);
        setUsageEvents((usageData || []) as UsageEvent[]);
        setAuditLogs((auditData || []) as AuditLog[]);
      } else {
        setBillingSubscription(null);
        setUsageEvents([]);
        setAuditLogs([]);
      }

      setLoading(false);
    }

    if (!workspaceLoading) {
      void fetchSettings();
    }
  }, [activeWorkspaceId, canManageWorkspace, error, workspaceLoading]);

  // ── Actions ──────────────────────────────────────────────────────

  const copyToClipboard = useCallback(
    (text: string) => {
      navigator.clipboard.writeText(text);
      success("Copied to clipboard");
    },
    [success]
  );

  const testConnection = useCallback(async () => {
    if (!activeWorkspaceId) {
      error("No workspace selected");
      return;
    }

    if (!whatsappNumberId || !whatsappAccessTokenInput) {
      error("Enter a Phone Number ID and a fresh access token to test.");
      return;
    }

    setTestingConnection(true);
    try {
      const res = await fetch("/api/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: activeWorkspaceId,
          phoneNumberId: whatsappNumberId,
          accessToken: whatsappAccessTokenInput,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setConnectionStatus("error");
        error(data.error || "Connection failed");
        return;
      }

      setConnectionStatus("success");
      success("WhatsApp API credentials are valid.");
    } catch {
      setConnectionStatus("error");
      error("Network error while testing the connection");
    } finally {
      setTestingConnection(false);
    }
  }, [activeWorkspaceId, whatsappNumberId, whatsappAccessTokenInput, error, success]);

  const saveSettings = useCallback(async () => {
    if (!activeWorkspaceId) {
      error("No workspace selected");
      return;
    }

    setSavingSettings(true);
    try {
      const supabase = createClient();

      const { error: businessError } = await supabase
        .from("businesses")
        .update({
          name,
          business_type: businessType,
          phone_number: phoneNumber,
        })
        .eq("id", activeWorkspaceId);

      if (businessError) {
        throw businessError;
      }

      // ── FAQ upsert + targeted delete ──────────────────────────────
      const cleanedFaqs = faqs
        .map((faq, index) => ({
          id: faq.id.startsWith("new_") ? undefined : faq.id,
          business_id: activeWorkspaceId,
          question: faq.question.trim(),
          answer: faq.answer.trim(),
          display_order: index,
        }))
        .filter((faq) => faq.question && faq.answer);

      // Determine which existing FAQ IDs to keep
      const keepIds = cleanedFaqs
        .map((f) => f.id)
        .filter((id): id is string => Boolean(id));

      // Delete any FAQs not in the keep list
      if (keepIds.length > 0) {
        await supabase
          .from("faqs")
          .delete()
          .eq("business_id", activeWorkspaceId)
          .not("id", "in", `(${keepIds.join(",")})`);
      } else {
        await supabase.from("faqs").delete().eq("business_id", activeWorkspaceId);
      }

      // Upsert remaining (insert new, update existing)
      if (cleanedFaqs.length > 0) {
        const toInsert = cleanedFaqs.filter((f) => !f.id).map(({ id: _id, ...rest }) => rest);
        const toUpdate = cleanedFaqs.filter((f) => f.id) as Array<{
          id: string;
          business_id: string;
          question: string;
          answer: string;
          display_order: number;
        }>;

        if (toInsert.length > 0) {
          const { error: insertError } = await supabase.from("faqs").insert(toInsert);
          if (insertError) throw insertError;
        }

        for (const faq of toUpdate) {
          const { error: updateError } = await supabase
            .from("faqs")
            .update({ question: faq.question, answer: faq.answer, display_order: faq.display_order })
            .eq("id", faq.id);
          if (updateError) throw updateError;
        }
      }

      if (canManageWorkspace) {
        const configResponse = await fetch("/api/workspace/whatsapp-config", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workspaceId: activeWorkspaceId,
            whatsappNumberId,
            accessToken: whatsappAccessTokenInput || null,
            clearAccessToken: clearStoredAccessToken,
            appSecret: whatsappAppSecretInput || null,
            clearAppSecret: clearStoredAppSecret,
            followUpEnabled,
            followUpTemplateName,
            followUpTemplateLanguageCode,
            followUpTemplateVariables: followUpVariablesList,
          }),
        });

        const configPayload = await configResponse.json();
        if (!configResponse.ok) {
          throw new Error(configPayload.error || "Failed to save WhatsApp settings");
        }

        setStoredAccessTokenLast4(
          clearStoredAccessToken
            ? null
            : whatsappAccessTokenInput
              ? whatsappAccessTokenInput.slice(-4)
              : storedAccessTokenLast4
        );
        setStoredAppSecretLast4(
          clearStoredAppSecret
            ? null
            : whatsappAppSecretInput
              ? whatsappAppSecretInput.slice(-4)
              : storedAppSecretLast4
        );
        setWhatsappAccessTokenInput("");
        setWhatsappAppSecretInput("");
        setClearStoredAccessToken(false);
        setClearStoredAppSecret(false);
      }

      success("Settings saved successfully!");
    } catch (saveError) {
      console.error(saveError);
      error(saveError instanceof Error ? saveError.message : "Failed to save settings");
    } finally {
      setSavingSettings(false);
    }
  }, [
    activeWorkspaceId,
    name,
    businessType,
    phoneNumber,
    faqs,
    canManageWorkspace,
    whatsappNumberId,
    whatsappAccessTokenInput,
    clearStoredAccessToken,
    whatsappAppSecretInput,
    clearStoredAppSecret,
    followUpEnabled,
    followUpTemplateName,
    followUpTemplateLanguageCode,
    followUpVariablesList,
    storedAccessTokenLast4,
    storedAppSecretLast4,
    error,
    success,
  ]);

  // ── FAQ helpers ──────────────────────────────────────────────────

  const addFaq = useCallback(() => {
    setFaqs((prev) => [
      ...prev,
      {
        id: `new_${Date.now()}`,
        business_id: activeWorkspaceId || "",
        question: "",
        answer: "",
      },
    ]);
  }, [activeWorkspaceId]);

  const updateFaq = useCallback((id: string, field: keyof FAQ, value: string) => {
    setFaqs((current) =>
      current.map((faq) => (faq.id === id ? { ...faq, [field]: value } : faq))
    );
  }, []);

  const removeFaq = useCallback((id: string) => {
    setFaqs((current) => current.filter((faq) => faq.id !== id));
  }, []);

  const reorderFaqs = useCallback((reorderedFaqs: FAQ[]) => {
    setFaqs(reorderedFaqs);
  }, []);

  return {
    // State
    loading: loading || workspaceLoading,
    savingSettings,
    testingConnection,
    connectionStatus,
    canManageWorkspace,
    role,
    activeWorkspace,
    activeWorkspaceId,

    // Business profile
    name,
    setName,
    businessType,
    setBusinessType,
    phoneNumber,
    setPhoneNumber,

    // WhatsApp
    whatsappNumberId,
    setWhatsappNumberId,
    storedAccessTokenLast4,
    storedAppSecretLast4,
    whatsappAccessTokenInput,
    setWhatsappAccessTokenInput,
    whatsappAppSecretInput,
    setWhatsappAppSecretInput,
    clearStoredAccessToken,
    setClearStoredAccessToken,
    clearStoredAppSecret,
    setClearStoredAppSecret,
    webhookURL,
    verifyToken,

    // Follow-up
    followUpEnabled,
    setFollowUpEnabled,
    followUpTemplateName,
    setFollowUpTemplateName,
    followUpTemplateLanguageCode,
    setFollowUpTemplateLanguageCode,
    followUpTemplateVariables,
    setFollowUpTemplateVariables,

    // Data
    faqs,
    billingSubscription,
    usageEvents,
    auditLogs,

    // Actions
    copyToClipboard,
    testConnection,
    saveSettings,
    addFaq,
    updateFaq,
    removeFaq,
    reorderFaqs,
  };
}
