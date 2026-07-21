"use client";

import React from "react";
import { WifiOff, RefreshCcw } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

export default function OfflinePage() {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-accent-glow rounded-full blur-[100px] opacity-20 pointer-events-none" />

      <div className="glass-card max-w-md w-full p-8 rounded-2xl flex flex-col items-center text-center z-10 relative">
        <div className="mb-6">
          <Logo size="lg" />
        </div>

        <div className="w-20 h-20 bg-background border border-border rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(255,255,255,0.05)]">
          <WifiOff className="text-textMuted w-10 h-10" strokeWidth={1.5} />
        </div>

        <h1 className="text-2xl font-bold text-textPrimary mb-3 font-sora">
          You are offline
        </h1>
        <p className="text-sm text-textMuted mb-8 leading-relaxed">
          ReplySync requires an active internet connection to dispatch signals and manage WhatsApp conversations. Please check your network and try again.
        </p>

        <button 
          onClick={handleReload}
          className="btn-primary w-full flex items-center justify-center gap-2"
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
