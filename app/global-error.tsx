"use client";

import { AlertTriangle, RefreshCcw } from "lucide-react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
  return (
    <html lang="en">
      <body className="bg-background text-textPrimary antialiased flex flex-col items-center justify-center h-screen p-6 text-center">
        <div className="w-24 h-24 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-8">
            <AlertTriangle size={48} />
        </div>
        <h2 className="text-3xl font-bold text-textPrimary mb-4">Critical System Error</h2>
        <p className="text-textMuted max-w-lg mx-auto mb-10">
            A fatal error bypassed our active layout boundaries. 
            <br/><br/>
            <span className="font-mono text-xs bg-surface p-4 rounded-xl border border-border inline-block whitespace-pre-wrap">{error.message}</span>
        </p>
        
        <button 
            onClick={() => reset()}
            className="flex items-center gap-2 px-8 py-3 bg-primary text-background hover:bg-opacity-90 rounded-xl font-bold transition-all shadow-glow-primary"
        >
            <RefreshCcw size={18} /> Recover Framework
        </button>
      </body>
    </html>
  );
}
