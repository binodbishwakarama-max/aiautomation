"use client";

import {
  CheckCircle2,
  Copy,
  Link as LinkIcon,
  MessageCircle,
  XCircle,
} from "lucide-react";

interface WhatsAppCredentialsCardProps {
  whatsappNumberId: string;
  setWhatsappNumberId: (v: string) => void;
  storedAccessTokenLast4: string | null;
  storedAppSecretLast4: string | null;
  whatsappAccessTokenInput: string;
  setWhatsappAccessTokenInput: (v: string) => void;
  whatsappAppSecretInput: string;
  setWhatsappAppSecretInput: (v: string) => void;
  clearStoredAccessToken: boolean;
  setClearStoredAccessToken: (v: boolean) => void;
  clearStoredAppSecret: boolean;
  setClearStoredAppSecret: (v: boolean) => void;
  webhookURL: string;
  verifyToken: string;
  connectionStatus: "idle" | "success" | "error";
  testingConnection: boolean;
  disabled: boolean;
  onTestConnection: () => void;
  onCopyToClipboard: (text: string) => void;
}

export default function WhatsAppCredentialsCard({
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
  connectionStatus,
  testingConnection,
  disabled,
  onTestConnection,
  onCopyToClipboard,
}: WhatsAppCredentialsCardProps) {
  return (
    <section className="bg-surface border border-border p-6 rounded-card">
      <div className="flex justify-between items-start mb-6 gap-4">
        <div>
          <h2 className="text-lg font-bold text-textPrimary flex items-center gap-2 mb-1">
            <MessageCircle size={18} className="text-secondary" /> WhatsApp Tenant Credentials
          </h2>
          <p className="text-xs text-textMuted max-w-2xl">
            Secrets are stored encrypted at rest and only surfaced as masked fingerprints in the UI.
          </p>
        </div>
        {connectionStatus === "success" && (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold rounded-lg">
            <CheckCircle2 size={14} /> Verified
          </span>
        )}
        {connectionStatus === "error" && (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold rounded-lg">
            <XCircle size={14} /> Verification Failed
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-textMuted mb-2">WhatsApp Phone Number ID</label>
          <input
            type="text"
            value={whatsappNumberId}
            disabled={disabled}
            onChange={(e) => setWhatsappNumberId(e.target.value)}
            placeholder="e.g. 1029384756"
            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 font-mono text-sm text-textPrimary focus:border-primary focus:outline-none disabled:opacity-60"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-textMuted mb-2">Stored Access Token</label>
          <div className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-textPrimary">
            {storedAccessTokenLast4 ? `••••••••${storedAccessTokenLast4}` : "Not configured"}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-textMuted mb-2">Rotate Access Token</label>
          <input
            type="password"
            value={whatsappAccessTokenInput}
            disabled={disabled}
            onChange={(e) => setWhatsappAccessTokenInput(e.target.value)}
            placeholder="Paste a fresh temporary or permanent token"
            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 font-mono text-sm text-textPrimary focus:border-primary focus:outline-none disabled:opacity-60"
          />
          <label className="mt-2 inline-flex items-center gap-2 text-xs text-textMuted">
            <input
              type="checkbox"
              checked={clearStoredAccessToken}
              disabled={disabled}
              onChange={(e) => setClearStoredAccessToken(e.target.checked)}
            />
            Clear the stored token on save
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-textMuted mb-2">Stored App Secret</label>
          <div className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-textPrimary">
            {storedAppSecretLast4 ? `••••••••${storedAppSecretLast4}` : "Not configured"}
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-textMuted mb-2">Rotate Meta App Secret</label>
          <input
            type="password"
            value={whatsappAppSecretInput}
            disabled={disabled}
            onChange={(e) => setWhatsappAppSecretInput(e.target.value)}
            placeholder="Required to verify webhook signatures"
            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 font-mono text-sm text-textPrimary focus:border-primary focus:outline-none disabled:opacity-60"
          />
          <label className="mt-2 inline-flex items-center gap-2 text-xs text-textMuted">
            <input
              type="checkbox"
              checked={clearStoredAppSecret}
              disabled={disabled}
              onChange={(e) => setClearStoredAppSecret(e.target.checked)}
            />
            Clear the stored app secret on save
          </label>
        </div>
      </div>

      <div className="mt-8 space-y-6">
        <div className="p-4 bg-background border border-border rounded-xl">
          <p className="text-xs font-bold text-textMuted uppercase mb-3">Webhook Configuration</p>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-textMuted w-12">URL</span>
              <div className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-xs font-mono text-textPrimary truncate">
                {webhookURL}
              </div>
              <button
                onClick={() => onCopyToClipboard(webhookURL)}
                className="p-2 bg-surface border border-border rounded-lg text-textMuted hover:text-textPrimary hover:border-primary transition-colors"
              >
                <Copy size={16} />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-textMuted w-12">Token</span>
              <div className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-xs font-mono text-textPrimary truncate">
                {verifyToken}
              </div>
              <button
                onClick={() => onCopyToClipboard(verifyToken)}
                className="p-2 bg-surface border border-border rounded-lg text-textMuted hover:text-textPrimary hover:border-primary transition-colors"
              >
                <Copy size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={onTestConnection}
            disabled={testingConnection || disabled}
            className="flex items-center gap-2 px-5 py-2.5 bg-background border border-border hover:border-primary hover:text-primary transition-colors rounded-xl text-sm font-bold text-textPrimary disabled:opacity-50"
          >
            <LinkIcon size={16} />
            {testingConnection ? "Testing..." : "Test New Credentials"}
          </button>
        </div>
      </div>
    </section>
  );
}
