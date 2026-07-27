"use client";

import { useState, useEffect, useRef } from "react";
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
  const hasExchangedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const state = urlParams.get("state");
    const errorParam = urlParams.get("error_description") || urlParams.get("error");

    if (errorParam) {
      setActiveStep(2);
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
      setOauthError(errorParam);
    } else if (code) {
      setActiveStep(2);

      if (!workspaceId) {
        // Wait until workspaceId is loaded from useWorkspace hook
        return;
      }

      if (hasExchangedRef.current) {
        return;
      }
      hasExchangedRef.current = true;

      if (state && state !== workspaceId) {
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
        setOauthError("State mismatch during OAuth return. Please try connecting again.");
        return;
      }

      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);

      const exchangeToken = async () => {
        setConnectingOauth(true);
        setOauthError(null);
        try {
          const origin = typeof window !== "undefined" ? window.location.origin : "";
          const redirectUri = `${origin}/settings`;
          const res = await fetch("/api/workspace/whatsapp-oauth", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code, workspaceId, redirectUri }),
          });
          const data = await res.json();
          if (res.ok && data.success) {
            window.location.reload();
          } else {
            setOauthError(data.error || "Failed to exchange authorization code.");
          }
        } catch (err) {
          console.error("WhatsApp OAuth exchange error:", err);
          setOauthError(err instanceof Error ? err.message : "An unexpected error occurred during setup.");
        } finally {
          setConnectingOauth(false);
        }
      };

      void exchangeToken();
    }
  }, [workspaceId]);

  const handleFacebookConnect = () => {
    const appId = process.env.NEXT_PUBLIC_META_APP_ID;
    const rawConfigId = process.env.NEXT_PUBLIC_META_CONFIG_ID;
    const configId = rawConfigId && rawConfigId !== "your_meta_config_id_here" ? rawConfigId : null;

    if (!appId || appId === "your_meta_app_id_here") {
      setOauthError("Meta App ID (NEXT_PUBLIC_META_APP_ID) is missing. Please configure it in your Vercel Environment Variables.");
      return;
    }

    setOauthError(null);
    setConnectingOauth(true);

    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const redirectUri = `${origin}/settings`;

    // 1. Try JS SDK Popup if loaded
    if (typeof window !== "undefined" && (window as unknown as { FB?: unknown }).FB) {
      try {
        const fb = (window as unknown as { FB: { login: (cb: (res: { authResponse?: { code?: string } }) => void, opts: Record<string, unknown>) => void } }).FB;
        const opts: Record<string, unknown> = {
          response_type: "code",
          override_default_response_type: true,
        };

        if (configId) {
          opts.config_id = configId;
        } else {
          opts.scope = "whatsapp_business_management,whatsapp_business_messaging";
        }

        fb.login((response) => {
          if (response?.authResponse?.code) {
            const code = response.authResponse.code;
            void (async () => {
              try {
                const res = await fetch("/api/workspace/whatsapp-oauth", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ code, workspaceId, redirectUri }),
                });
                const data = await res.json();
                if (res.ok && data.success) {
                  window.location.reload();
                } else {
                  setOauthError(data.error || "Failed to exchange authorization code.");
                }
              } catch (err) {
                console.error("Facebook SDK OAuth exchange error:", err);
                setOauthError(err instanceof Error ? err.message : "OAuth token exchange failed.");
              } finally {
                setConnectingOauth(false);
              }
            })();
          } else {
            setConnectingOauth(false);
          }
        }, opts);
        return;
      } catch (fbErr) {
        console.warn("FB SDK popup launch error, falling back to OAuth redirect:", fbErr);
      }
    }

    // 2. Standard OAuth Dialog Redirect Fallback
    const oauthUrl = configId
      ? `https://www.facebook.com/v19.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(
          redirectUri
        )}&config_id=${configId}&response_type=code&override_default_response_type=true&state=${workspaceId}`
      : `https://www.facebook.com/v19.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(
          redirectUri
        )}&scope=whatsapp_business_management,whatsapp_business_messaging&response_type=code&state=${workspaceId}`;

    window.location.href = oauthUrl;
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
    <section className="glass-card p-4 sm:p-8 md:p-10 rounded-card shimmer-container">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-white/5 pb-8">
        <div>
          <h2 className="text-lg font-bold text-textPrimary flex items-center gap-2 mb-1 bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
            <MessageCircle size={20} className="text-primary animate-pulse" /> WhatsApp Setup Assistant
          </h2>
          <p className="text-xs text-textMuted max-w-2xl">
            Configure your Meta WhatsApp connection step-by-step. Secrets are stored securely with AES-256 encryption.
          </p>
        </div>
        
        {connectionStatus === "success" && (
          <span className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-xl shadow-[0_0_15px_-3px_rgba(16,185,129,0.25)]">
            <CheckCircle2 size={14} /> Verified Connection
          </span>
        )}
        {connectionStatus === "error" && (
          <span className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold rounded-xl shadow-[0_0_15px_-3px_rgba(244,63,94,0.25)] animate-pulse">
            <XCircle size={14} /> Verification Failed
          </span>
        )}
      </div>

      {/* Global OAuth Progress & Error Banners */}
      {connectingOauth && (
        <div className="mb-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold flex items-center gap-3 animate-pulse">
          <div className="w-4 h-4 rounded-full border-2 border-blue-400 border-t-transparent animate-spin shrink-0" />
          <span>Exchanging Facebook authorization code and setting up WhatsApp Business Account...</span>
        </div>
      )}

      {oauthError && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-start gap-3">
          <XCircle size={16} className="shrink-0 mt-0.5 text-rose-400" />
          <div className="flex-1">
            <div className="font-bold mb-0.5 text-rose-300">WhatsApp Connection Alert</div>
            <div className="text-rose-400/90 leading-relaxed">{oauthError}</div>
          </div>
        </div>
      )}

      {/* Modern Google-Style Step Bar */}
      <div className="flex items-center justify-between max-w-3xl mx-auto mb-10 relative">
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-white/5 -z-10" />
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-primary to-secondary -z-10 transition-all duration-300"
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
              className="flex flex-col items-center gap-2.5 focus:outline-none group"
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm border transition-all duration-300 ${
                  isCompleted
                    ? "bg-primary border-primary text-background shadow-[0_0_15px_-2px_rgba(110,231,183,0.3)]"
                    : isActive
                    ? "bg-background border-primary text-primary shadow-[0_0_20px_-3px_rgba(110,231,183,0.4)] scale-110"
                    : "bg-background border-white/5 text-textMuted group-hover:border-white/20"
                }`}
              >
                {isCompleted ? <Check size={14} /> : step.number}
              </div>
              <span
                className={`text-xs font-semibold tracking-wide transition-colors duration-300 hidden sm:inline ${
                  isActive ? "text-primary font-bold" : "text-textMuted group-hover:text-textPrimary"
                }`}
              >
                {step.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Step Panel Contents */}
      <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-4 sm:p-8 min-h-[300px] flex flex-col justify-between backdrop-blur-md transition-all duration-300">
        
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
                <div className="flex items-center gap-2 bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3 hover:border-white/10 transition-all duration-300">
                  <div className="flex-1 font-mono text-xs text-textPrimary truncate">{webhookURL}</div>
                  <button
                    type="button"
                    onClick={handleCopyUrl}
                    className="p-1.5 hover:text-primary transition-colors text-textMuted active:scale-90 min-w-[44px] min-h-[44px] flex items-center justify-center"
                    title="Copy URL"
                  >
                    {copiedUrl ? <Check size={16} className="text-primary" /> : <Copy size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-textMuted">Verify Token</span>
                <div className="flex items-center gap-2 bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3 hover:border-white/10 transition-all duration-300">
                  <div className="flex-1 font-mono text-xs text-textPrimary truncate">{verifyToken}</div>
                  <button
                    type="button"
                    onClick={handleCopyToken}
                    className="p-1.5 hover:text-primary transition-colors text-textMuted active:scale-90 min-w-[44px] min-h-[44px] flex items-center justify-center"
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
            <div className="flex flex-col items-center justify-center p-4 sm:p-8 border border-white/5 bg-white/[0.01] rounded-2xl text-center space-y-5 max-w-xl mx-auto w-full shadow-inner">
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
                className="flex items-center justify-center gap-2.5 px-6 py-3 bg-[#1877f2] hover:bg-[#156bec] disabled:opacity-50 text-white font-bold rounded-xl shadow-lg transition-all text-xs w-full max-w-xs cursor-pointer active:scale-95 min-h-[44px]"
              >
                {connectingOauth ? "Connecting..." : "Connect with Facebook"}
              </button>

              {oauthError && (
                <p className="text-xs text-red-500 font-medium animate-pulse">{oauthError}</p>
              )}
            </div>

            <div className="flex items-center justify-center gap-4 my-2 max-w-xl mx-auto w-full">
              <div className="flex-grow h-px bg-white/5"></div>
              <span className="text-[10px] text-textMuted font-bold uppercase tracking-widest">Or</span>
              <div className="flex-grow h-px bg-white/5"></div>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowManual((prev) => !prev)}
                className="text-xs font-semibold text-primary hover:underline min-h-[44px] inline-flex items-center"
              >
                {showManual ? "Hide Manual Form" : "Configure Manually (Advanced Devs)"}
              </button>
            </div>

            {showManual && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-white/5 mt-4 animate-fadeIn">
                <div>
                  <label className="block text-xs font-semibold text-textMuted mb-2">WhatsApp Phone Number ID</label>
                  <input
                    type="text"
                    value={whatsappNumberId}
                    disabled={disabled}
                    onChange={(e) => setWhatsappNumberId(e.target.value)}
                    placeholder="e.g. 1029384756"
                    className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3 font-mono text-base sm:text-sm text-textPrimary focus:border-primary/40 focus:ring-1 focus:ring-primary/40 focus:outline-none disabled:opacity-60 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-textMuted mb-2">Stored Access Token Status</label>
                  <div className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3 text-base sm:text-sm text-textPrimary flex items-center justify-between">
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
                    className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3 font-mono text-base sm:text-sm text-textPrimary focus:border-primary/40 focus:ring-1 focus:ring-primary/40 focus:outline-none disabled:opacity-60 transition-all"
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
                  <div className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3 text-base sm:text-sm text-textPrimary flex items-center justify-between">
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
                    className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3 font-mono text-base sm:text-sm text-textPrimary focus:border-primary/40 focus:ring-1 focus:ring-primary/40 focus:outline-none disabled:opacity-60 transition-all"
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


            <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-4 flex items-start gap-2.5 text-xs text-amber-400 leading-relaxed">
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

            <div className="flex flex-col items-center justify-center p-4 sm:p-8 border border-white/5 border-dashed rounded-xl gap-4 bg-white/[0.01]">
              {connectionStatus === "success" ? (
                <div className="text-center space-y-2">
                  <CheckCircle2 size={48} className="text-emerald-500 mx-auto" />
                  <p className="font-bold text-emerald-400">Connection Verified Successfully</p>
                  <p className="text-xs text-textMuted">Your WhatsApp instance is fully operational and replying.</p>
                </div>
              ) : connectionStatus === "error" ? (
                <div className="text-center space-y-2">
                  <XCircle size={48} className="text-rose-500 mx-auto" />
                  <p className="font-bold text-rose-500">Verification Failed</p>
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
                className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-background font-bold rounded-xl shadow-glow-primary hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all text-sm min-h-[44px]"
              >
                <LinkIcon size={14} />
                {testingConnection ? "Testing Connection..." : "Test Connection"}
              </button>
            </div>
          </div>
        )}

        {/* Wizard Control Buttons */}
        <div className="flex justify-between items-center border-t border-white/5 pt-6 mt-8">
          <button
            type="button"
            disabled={activeStep === 1}
            onClick={() => setActiveStep((prev) => (prev - 1) as 1 | 2 | 3)}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-textMuted hover:text-textPrimary disabled:opacity-30 disabled:pointer-events-none transition-colors active:scale-95 min-h-[44px]"
          >
            <ChevronLeft size={16} /> Back
          </button>

          {activeStep < 3 ? (
            <button
              type="button"
              onClick={() => setActiveStep((prev) => (prev + 1) as 1 | 2 | 3)}
              className="flex items-center justify-center gap-1.5 px-5 py-2.5 bg-white/5 border border-white/5 hover:border-primary/30 hover:text-primary hover:bg-primary/5 transition-all rounded-xl text-xs font-bold text-textPrimary active:scale-95 min-h-[44px]"
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
