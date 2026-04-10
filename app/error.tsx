"use client";

import { AlertTriangle, RefreshCcw } from "lucide-react";
import Link from "next/link";

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] p-6 text-center">
      <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-6">
        <AlertTriangle size={36} />
      </div>
      <h2 className="text-2xl font-bold text-textPrimary mb-3">Something went wrong</h2>
      <p className="text-textMuted max-w-md mx-auto mb-8 text-sm">
        We hit a snag loading this module. The error has been tracked securely.
        <br/><br/>
        <span className="font-mono text-xs bg-surface p-2 rounded block whitespace-pre-wrap">{error.message}</span>
      </p>
      
      <div className="flex items-center gap-4">
        <button 
          onClick={() => reset()}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 rounded-xl font-bold transition-all"
        >
          <RefreshCcw size={16} /> Try Again
        </button>
        <Link href="/dashboard" className="text-textMuted hover:text-textPrimary transition-colors text-sm font-medium">
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
