"use client";

import React, { useState, useEffect } from "react";
import { Download, X, Share, CheckCircle2, Smartphone } from "lucide-react";
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
    // Check if running inside installed standalone PWA mode
    const isStandalone = 
      window.matchMedia("(display-mode: standalone)").matches || 
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) {
      setInstalled(true);
      return;
    }

    // Detect iOS devices
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(iosDevice);

    // Capture native PWA install prompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // Custom event listener for manual install triggers across app
    const handleOpenPrompt = () => {
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("open-pwa-prompt", handleOpenPrompt);

    // Auto show banner after 1.5s on mobile/desktop browsers
    const timer = setTimeout(() => {
      setShowBanner(true);
    }, 1500);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("open-pwa-prompt", handleOpenPrompt);
      clearTimeout(timer);
    };
  }, []);

  const handleInstallClick = async () => {
    setShowBanner(false);
    setShowIosGuide(true);

    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === "accepted") {
          setInstalled(true);
          setShowIosGuide(false);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.warn("Native prompt deferred, showing visual guide fallback.", err);
      }
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
  };

  if (installed || (!showBanner && !showIosGuide)) return null;

  return (
    <>
      {/* FLOATING PWA INSTALL POPUP BANNER */}
      {showBanner && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-[390px] z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="bg-[#131F24] border border-accent/40 rounded-xl p-4 shadow-2xl backdrop-blur-xl flex flex-col gap-3">
            
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <Logo iconOnly size="sm" />
                <div>
                  <div className="text-xs font-bold text-textPrimary flex items-center gap-1.5">
                    <span>Install ReplySync App</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-accent/20 text-accent font-bold">MOBILE APP</span>
                  </div>
                  <p className="text-[11px] text-textMuted leading-tight mt-0.5">
                    Install on your phone for one-tap launch & instant alerts.
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

      {/* STEP-BY-STEP MOBILE INSTALLATION GUIDE MODAL */}
      {showIosGuide && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-[#131F24] border border-border rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Logo iconOnly size="sm" />
                <span className="text-sm font-bold text-textPrimary">Install on Mobile Phone</span>
              </div>
              <button 
                onClick={() => setShowIosGuide(false)}
                className="p-1 rounded-lg text-textMuted hover:text-textPrimary"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-textMuted leading-relaxed">
              {isIos ? (
                <>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-background border border-border">
                    <span className="w-6 h-6 rounded-full bg-accent/20 text-accent font-bold flex items-center justify-center shrink-0 text-xs">1</span>
                    <p>Tap the <strong className="text-textPrimary flex items-center gap-1 inline-flex">Share icon <Share size={13} className="text-accent inline" /></strong> in Safari&apos;s bottom toolbar.</p>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-background border border-border">
                    <span className="w-6 h-6 rounded-full bg-accent/20 text-accent font-bold flex items-center justify-center shrink-0 text-xs">2</span>
                    <p>Scroll down and select <strong className="text-textPrimary font-semibold">&quot;Add to Home Screen&quot;</strong>.</p>
                  </div>
                </>
              ) : (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-background border border-border">
                  <span className="w-6 h-6 rounded-full bg-accent/20 text-accent font-bold flex items-center justify-center shrink-0 text-xs"><Smartphone size={14} /></span>
                  <p>Tap your browser menu (3 dots) and select <strong className="text-textPrimary font-semibold">&quot;Install App&quot;</strong> or <strong className="text-textPrimary font-semibold">&quot;Add to Home Screen&quot;</strong>.</p>
                </div>
              )}
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
