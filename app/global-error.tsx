"use client";

import { AlertTriangle, RefreshCcw } from "lucide-react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
  return (
    <html lang="en">
      <body className="bg-background text-textPrimary antialiased flex flex-col items-center justify-center min-h-[100dvh] w-full max-w-full p-4 sm:p-6 text-center">
        <div className="w-16 h-16 sm:w-24 sm:h-24 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-6 sm:mb-8">
            <AlertTriangle size={36} className="sm:w-12 sm:h-12" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-textPrimary mb-4">Critical System Error</h2>
        <p className="text-textMuted max-w-lg mx-auto mb-8 text-xs sm:text-sm">
            A fatal error bypassed our active layout boundaries. 
            <br/><br/>
            <span className="font-mono text-xs bg-surface p-3 sm:p-4 rounded-xl border border-border inline-block whitespace-pre-wrap max-w-full overflow-x-auto">{error.message}</span>
        </p>
        
        <button 
            onClick={() => reset()}
            className="flex items-center justify-center gap-2 px-6 sm:px-8 py-3 bg-accent text-[#0B1215] hover:bg-[#00ffaa] rounded-xl font-bold transition-all min-h-[44px] text-xs sm:text-sm"
        >
            <RefreshCcw size={18} /> Recover Framework
        </button>
      </body>
    </html>
  );
}
