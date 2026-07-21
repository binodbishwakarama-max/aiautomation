"use client";

import React from "react";
import { WifiOff, RefreshCcw } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

export default function OfflinePage() {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-[100dvh] w-full max-w-full bg-background flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[300px] h-[300px] bg-accent-glow rounded-full blur-[100px] opacity-20 pointer-events-none" />

      <div className="glass-card max-w-md w-full p-6 sm:p-8 rounded-2xl flex flex-col items-center text-center z-10 relative">
        <div className="mb-6">
          <Logo size="lg" />
        </div>

        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-background border border-border rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(255,255,255,0.05)]">
          <WifiOff className="text-textMuted w-8 h-8 sm:w-10 sm:h-10" strokeWidth={1.5} />
        </div>

        <h1 className="text-xl sm:text-2xl font-bold text-textPrimary mb-3 font-sora">
          You are offline
        </h1>
        <p className="text-xs sm:text-sm text-textMuted mb-8 leading-relaxed">
          ReplySync requires an active internet connection to dispatch signals and manage WhatsApp conversations. Please check your network and try again.
        </p>

        <button 
          onClick={handleReload}
          className="btn-primary w-full flex items-center justify-center gap-2 min-h-[44px]"
        >
          <RefreshCcw size={18} />
          <span>Retry Connection</span>
        </button>
      </div>
      
      <div className="mt-8 text-xs font-mono text-textMuted opacity-50">
        ReplySync Dispatch Engine • Offline Mode
      </div>
    </div>
  );
}
