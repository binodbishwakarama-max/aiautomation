"use client";

import React, { useState, useEffect } from "react";
import { Download, X, Share, CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed as standalone PWA
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
      return;
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(iosDevice);

    // Listen for native PWA beforeinstallprompt event (Android/Chrome/Windows/macOS)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Pop up banner after 2.5 seconds if not dismissed previously
    const timer = setTimeout(() => {
      const isDismissed = localStorage.getItem("replysync_pwa_dismissed");
      if (!isDismissed) {
        setShowBanner(true);
      }
    }, 2500);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      clearTimeout(timer);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Trigger native OS installation download prompt
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setInstalled(true);
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } else if (isIos) {
      // Show iOS step-by-step installation guide modal
      setShowIosGuide(true);
    } else {
      // Fallback for browsers ready for installation
      setShowBanner(false);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem("replysync_pwa_dismissed", "true");
  };

  if (installed || (!showBanner && !showIosGuide)) return null;

  return (
    <>
      {/* FLOATING PWA INSTALL POPUP BANNER */}
      {showBanner && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-[380px] z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="bg-[#131F24] border border-accent/30 rounded-xl p-4 shadow-2xl backdrop-blur-xl flex flex-col gap-3">
            
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <Logo iconOnly size="sm" />
                <div>
                  <div className="text-xs font-bold text-textPrimary flex items-center gap-1.5">
                    <span>Install ReplySync App</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-accent/20 text-accent font-bold">PWA</span>
                  </div>
                  <p className="text-[11px] text-textMuted leading-tight mt-0.5">
                    Fast one-tap access & zero-latency alerts on your phone.
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button 
                onClick={handleDismiss}
                className="p-1.5 rounded-lg text-textMuted hover:text-textPrimary bg-background/50 border border-border min-h-[36px] min-w-[36px] flex items-center justify-center shrink-0"
                aria-label="Close install banner"
              >
                <X size={16} />
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-1 border-t border-border/60">
              <button
                onClick={handleDismiss}
                className="flex-1 py-2 px-3 rounded-lg text-xs font-semibold text-textMuted hover:text-textPrimary bg-background/40 border border-border min-h-[40px]"
              >
                Not Now
              </button>
              <button
                onClick={handleInstallClick}
                className="flex-1 py-2 px-3 rounded-lg text-xs font-bold text-[#0B1215] bg-accent hover:bg-[#00ffaa] transition-colors min-h-[40px] flex items-center justify-center gap-1.5 shadow-glow-primary"
              >
                <Download size={14} strokeWidth={2.5} />
                <span>Install App</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* iOS STEP-BY-STEP INSTALLATION GUIDE MODAL */}
      {showIosGuide && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-[#131F24] border border-border rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Logo iconOnly size="sm" />
                <span className="text-sm font-bold text-textPrimary">Install on iPhone</span>
              </div>
              <button 
                onClick={() => setShowIosGuide(false)}
                className="p-1 rounded-lg text-textMuted hover:text-textPrimary"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-textMuted leading-relaxed">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-background border border-border">
                <span className="w-6 h-6 rounded-full bg-accent/20 text-accent font-bold flex items-center justify-center shrink-0 text-xs">1</span>
                <p>Tap the <strong className="text-textPrimary flex items-center gap-1 inline-flex">Share icon <Share size={13} className="text-accent inline" /></strong> in Safari&apos;s bottom toolbar.</p>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-background border border-border">
                <span className="w-6 h-6 rounded-full bg-accent/20 text-accent font-bold flex items-center justify-center shrink-0 text-xs">2</span>
                <p>Scroll down and select <strong className="text-textPrimary font-semibold">&quot;Add to Home Screen&quot;</strong>.</p>
              </div>
            </div>

            <button
              onClick={() => setShowIosGuide(false)}
              className="btn-primary w-full py-3 text-xs font-bold min-h-[44px] flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={16} />
              <span>Got It</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
