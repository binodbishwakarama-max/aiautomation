"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Copy,
  Link as LinkIcon,
  MessageCircle,
  XCircle,
  HelpCircle,
  ChevronRight,
  ChevronLeft,
  ExternalLink,
  Check,
  Lock,
} from "lucide-react";

interface WhatsAppCredentialsCardProps {
  workspaceId: string;
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
  workspaceId,
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
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  // OAuth & Manual configuration state
  const [showManual, setShowManual] = useState(!!storedAccessTokenLast4);
  const [connectingOauth, setConnectingOauth] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);

interface FBWindow {
  FB?: {
    login: (
      callback: (response: { authResponse?: { code?: string } }) => void,
      options?: { config_id?: string; response_type?: string; override_default_response_type?: boolean }
    ) => void;
  };
}

  const handleFacebookConnect = () => {
    const fb = (window as unknown as FBWindow).FB;
    if (!fb) {
      setOauthError("Facebook SDK not loaded. Please wait a moment or configure manually.");
      return;
    }
    setOauthError(null);
    setConnectingOauth(true);

    fb.login(
      async (response: { authResponse?: { code?: string } }) => {
        if (response.authResponse && response.authResponse.code) {
          const code = response.authResponse.code;
          try {
            const res = await fetch("/api/workspace/whatsapp-oauth", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ code, workspaceId }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
              window.location.reload();
            } else {
              setOauthError(data.error || "Failed to exchange authorization code.");
            }
          } catch (err) {
            console.error("WhatsApp OAuth exchange error:", err);
            setOauthError("An unexpected error occurred during setup.");
          } finally {
            setConnectingOauth(false);
          }
        } else {
          setOauthError("Facebook Login was cancelled or failed to authenticate.");
          setConnectingOauth(false);
        }
      },
      {
        config_id: process.env.NEXT_PUBLIC_META_CONFIG_ID,
        response_type: "code",
        override_default_response_type: true,
      }
    );
  };

  const handleCopyUrl = () => {
    onCopyToClipboard(webhookURL);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleCopyToken = () => {
    onCopyToClipboard(verifyToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const steps = [
    { number: 1, label: "Meta Webhook Setup" },
    { number: 2, label: "Tenant Credentials" },
    { number: 3, label: "Verify & Test" },
  ];

  return (
    <section className="bg-surface border border-border p-6 rounded-card transition-all duration-300">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-border pb-6">
        <div>
          <h2 className="text-lg font-bold text-textPrimary flex items-center gap-2 mb-1">
            <MessageCircle size={20} className="text-primary animate-pulse" /> WhatsApp Setup Assistant
          </h2>
          <p className="text-xs text-textMuted max-w-2xl">
            Configure your Meta WhatsApp connection step-by-step. Secrets are stored securely with AES-256 encryption.
          </p>
        </div>
        
        {connectionStatus === "success" && (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold rounded-lg shadow-sm">
            <CheckCircle2 size={14} /> Verified Connection
          </span>
        )}
        {connectionStatus === "error" && (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold rounded-lg shadow-sm animate-bounce">
            <XCircle size={14} /> Verification Failed
          </span>
        )}
      </div>

      {/* Modern Google-Style Step Bar */}
      <div className="flex items-center justify-between max-w-3xl mx-auto mb-10 relative">
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-border -z-10" />
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-primary -z-10 transition-all duration-300"
          style={{ width: `${((activeStep - 1) / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((step) => {
          const isCompleted = activeStep > step.number;
          const isActive = activeStep === step.number;
          return (
            <button
              key={step.number}
              type="button"
              onClick={() => setActiveStep(step.number as 1 | 2 | 3)}
              className="flex flex-col items-center gap-2 focus:outline-none"
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all duration-300 ${
                  isCompleted
                    ? "bg-primary border-primary text-background"
                    : isActive
                    ? "bg-background border-primary text-primary shadow-glow-primary scale-110"
                    : "bg-background border-border text-textMuted"
                }`}
              >
                {isCompleted ? <Check size={16} /> : step.number}
              </div>
              <span
                className={`text-xs font-medium transition-colors duration-300 hidden sm:inline ${
                  isActive ? "text-primary font-bold" : "text-textMuted"
                }`}
              >
                {step.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Step Panel Contents */}
      <div className="bg-background/40 border border-border/60 rounded-2xl p-6 min-h-[280px] flex flex-col justify-between">
        
        {/* STEP 1: Meta Webhook Setup */}
        {activeStep === 1 && (
          <div className="space-y-5 animate-fadeIn">
            <div>
              <span className="text-xs font-bold text-primary uppercase tracking-wider">Step 1 of 3</span>
              <h3 className="text-base font-bold text-textPrimary mt-1">Setup Webhook in Meta developer console</h3>
              <p className="text-sm text-textMuted mt-2 leading-relaxed">
                Meta needs to send WhatsApp messages to ReplySync. Copy these details and paste them in the{" "}
                <a 
                  href="https://developers.facebook.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary inline-flex items-center gap-0.5 underline hover:text-opacity-80"
                >
                  Meta Developer Dashboard <ExternalLink size={12} />
                </a>{" "}
                under <strong>WhatsApp &gt; Configuration &gt; Webhooks</strong>.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-textMuted">Callback URL</span>
                <div className="flex items-center gap-2 bg-surface border border-border rounded-xl px-4 py-2.5">
                  <div className="flex-1 font-mono text-xs text-textPrimary truncate">{webhookURL}</div>
                  <button
                    type="button"
                    onClick={handleCopyUrl}
                    className="p-1.5 hover:text-primary transition-colors text-textMuted"
                    title="Copy URL"
                  >
                    {copiedUrl ? <Check size={16} className="text-primary" /> : <Copy size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-textMuted">Verify Token</span>
                <div className="flex items-center gap-2 bg-surface border border-border rounded-xl px-4 py-2.5">
                  <div className="flex-1 font-mono text-xs text-textPrimary truncate">{verifyToken}</div>
                  <button
                    type="button"
                    onClick={handleCopyToken}
                    className="p-1.5 hover:text-primary transition-colors text-textMuted"
                    title="Copy Token"
                  >
                    {copiedToken ? <Check size={16} className="text-primary" /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Tenant Credentials */}
        {activeStep === 2 && (
          <div className="space-y-5 animate-fadeIn">
            <div>
              <span className="text-xs font-bold text-primary uppercase tracking-wider">Step 2 of 3</span>
              <h3 className="text-base font-bold text-textPrimary mt-1">Configure Meta Credentials</h3>
              <p className="text-sm text-textMuted mt-2 leading-relaxed">
                Connect your WhatsApp business account securely using Meta OAuth or input credentials manually.
              </p>
            </div>

            {/* Google-like Connect Button */}
            <div className="flex flex-col items-center justify-center p-6 border border-border/80 bg-surface/30 rounded-2xl text-center space-y-4 max-w-xl mx-auto w-full">
              <div className="w-12 h-12 rounded-full bg-blue-600/10 flex items-center justify-center text-blue-500 font-bold text-xl">
                f
              </div>
              <div>
                <h4 className="font-bold text-textPrimary text-sm">One-Click WhatsApp Connection</h4>
                <p className="text-xs text-textMuted max-w-sm mt-1 leading-relaxed">
                  Connect your business details automatically. Log in with Facebook to select your WhatsApp number.
                </p>
              </div>

              <button
                type="button"
                onClick={handleFacebookConnect}
                disabled={connectingOauth || disabled}
                className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition-all text-xs w-full max-w-xs cursor-pointer"
              >
                {connectingOauth ? "Connecting..." : "Connect with Facebook"}
              </button>

              {oauthError && (
                <p className="text-xs text-red-500 font-medium animate-pulse">{oauthError}</p>
              )}
            </div>

            <div className="flex items-center justify-center gap-4 my-2 max-w-xl mx-auto w-full">
              <div className="flex-grow h-px bg-border/50"></div>
              <span className="text-[10px] text-textMuted font-bold uppercase tracking-widest">Or</span>
              <div className="flex-grow h-px bg-border/50"></div>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowManual((prev) => !prev)}
                className="text-xs font-semibold text-primary hover:underline"
              >
                {showManual ? "Hide Manual Form" : "Configure Manually (Advanced Devs)"}
              </button>
            </div>

            {showManual && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-border/40 mt-4 animate-fadeIn">
                <div>
                  <label className="block text-xs font-semibold text-textMuted mb-2">WhatsApp Phone Number ID</label>
                  <input
                    type="text"
                    value={whatsappNumberId}
                    disabled={disabled}
                    onChange={(e) => setWhatsappNumberId(e.target.value)}
                    placeholder="e.g. 1029384756"
                    className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 font-mono text-sm text-textPrimary focus:border-primary focus:outline-none disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-textMuted mb-2">Stored Access Token Status</label>
                  <div className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-textPrimary flex items-center justify-between">
                    <span>{storedAccessTokenLast4 ? `••••••••${storedAccessTokenLast4}` : "Not configured"}</span>
                    <Lock size={14} className="text-textMuted" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-textMuted mb-2">Rotate Access Token</label>
                  <input
                    type="password"
                    value={whatsappAccessTokenInput}
                    disabled={disabled}
                    onChange={(e) => setWhatsappAccessTokenInput(e.target.value)}
                    placeholder="Paste fresh system user or temporary token"
                    className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 font-mono text-sm text-textPrimary focus:border-primary focus:outline-none disabled:opacity-60"
                  />
                  <label className="mt-2 inline-flex items-center gap-2 text-xs text-textMuted select-none cursor-pointer">
                    <input
                      type="checkbox"
                      checked={clearStoredAccessToken}
                      disabled={disabled}
                      onChange={(e) => setClearStoredAccessToken(e.target.checked)}
                    />
                    Clear stored token on save
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-textMuted mb-2">Stored App Secret Status</label>
                  <div className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-textPrimary flex items-center justify-between">
                    <span>{storedAppSecretLast4 ? `••••••••${storedAppSecretLast4}` : "Not configured"}</span>
                    <Lock size={14} className="text-textMuted" />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-textMuted mb-2">Rotate Meta App Secret</label>
                  <input
                    type="password"
                    value={whatsappAppSecretInput}
                    disabled={disabled}
                    onChange={(e) => setWhatsappAppSecretInput(e.target.value)}
                    placeholder="App Secret (found under Settings > Basic in your App Dashboard)"
                    className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 font-mono text-sm text-textPrimary focus:border-primary focus:outline-none disabled:opacity-60"
                  />
                  <label className="mt-2 inline-flex items-center gap-2 text-xs text-textMuted select-none cursor-pointer">
                    <input
                      type="checkbox"
                      checked={clearStoredAppSecret}
                      disabled={disabled}
                      onChange={(e) => setClearStoredAppSecret(e.target.checked)}
                    />
                    Clear stored app secret on save
                  </label>
                </div>
              </div>
            )}


            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-amber-500">
              <HelpCircle size={16} className="shrink-0 mt-0.5" />
              <span><strong>Note:</strong> Make sure to click <strong>Save Changes</strong> at the top right of this page to submit newly entered credentials.</span>
            </div>
          </div>
        )}

        {/* STEP 3: Verify & Test */}
        {activeStep === 3 && (
          <div className="space-y-5 animate-fadeIn">
            <div>
              <span className="text-xs font-bold text-primary uppercase tracking-wider">Step 3 of 3</span>
              <h3 className="text-base font-bold text-textPrimary mt-1">Verify Connection Settings</h3>
              <p className="text-sm text-textMuted mt-2 leading-relaxed">
                Test if ReplySync can connect to your Meta WhatsApp Business API. Make sure you have clicked <strong>Save Changes</strong> at the top of the page before testing.
              </p>
            </div>

            <div className="flex flex-col items-center justify-center p-6 border border-border border-dashed rounded-xl gap-4 bg-surface/30">
              {connectionStatus === "success" ? (
                <div className="text-center space-y-2">
                  <CheckCircle2 size={48} className="text-green-500 mx-auto" />
                  <p className="font-bold text-green-400">Connection Verified Successfully</p>
                  <p className="text-xs text-textMuted">Your WhatsApp instance is fully operational and replying.</p>
                </div>
              ) : connectionStatus === "error" ? (
                <div className="text-center space-y-2">
                  <XCircle size={48} className="text-red-500 mx-auto" />
                  <p className="font-bold text-red-500">Verification Failed</p>
                  <p className="text-xs text-textMuted">Check your Phone Number ID and Access Token settings, save changes, and try again.</p>
                </div>
              ) : (
                <div className="text-center space-y-2">
                  <LinkIcon size={48} className="text-textMuted mx-auto" />
                  <p className="font-bold text-textPrimary">Pending Test Run</p>
                  <p className="text-xs text-textMuted">Press the button below to execute the link verification check.</p>
                </div>
              )}

              <button
                type="button"
                onClick={onTestConnection}
                disabled={testingConnection || disabled}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary text-background font-bold rounded-xl shadow-glow-primary hover:bg-opacity-90 disabled:opacity-50 transition-all text-sm"
              >
                <LinkIcon size={14} />
                {testingConnection ? "Testing Connection..." : "Test Connection"}
              </button>
            </div>
          </div>
        )}

        {/* Wizard Control Buttons */}
        <div className="flex justify-between items-center border-t border-border pt-6 mt-8">
          <button
            type="button"
            disabled={activeStep === 1}
            onClick={() => setActiveStep((prev) => (prev - 1) as 1 | 2 | 3)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-textMuted hover:text-textPrimary disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            <ChevronLeft size={16} /> Back
          </button>

          {activeStep < 3 ? (
            <button
              type="button"
              onClick={() => setActiveStep((prev) => (prev + 1) as 1 | 2 | 3)}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-surface border border-border hover:border-primary hover:text-primary transition-all rounded-xl text-xs font-bold text-textPrimary"
            >
              Continue <ChevronRight size={16} />
            </button>
          ) : (
            <div className="text-xs text-textMuted italic">Setup Assistant Complete</div>
          )}
        </div>
      </div>
    </section>
  );
}
