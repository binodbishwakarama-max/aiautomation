import Link from "next/link";
import { Ghost, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] w-full max-w-full bg-background text-textPrimary p-4 overflow-hidden text-center">
      <div className="relative">
        <Ghost size={100} className="text-border opacity-20" />
        <h1 className="text-[90px] sm:text-[150px] font-bold text-primary opacity-90 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 saturate-200 blur-[2px]">404</h1>
        <h1 className="text-[90px] sm:text-[150px] font-bold text-background absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 drop-shadow-md z-10">404</h1>
      </div>
      
      <h2 className="text-2xl sm:text-3xl font-bold mt-4 mb-2 z-20">Page Not Found</h2>
      <p className="text-textMuted max-w-sm text-center mb-8 text-xs sm:text-sm z-20">
        We couldn&apos;t track down the module you&apos;re looking for. It might have been relocated or completely erased.
      </p>

      <Link 
        href="/dashboard" 
        className="flex items-center justify-center gap-2 px-6 sm:px-8 py-3 bg-surface border border-border hover:border-primary hover:text-primary transition-colors text-textPrimary font-bold rounded-xl z-20 min-h-[44px] text-xs sm:text-sm"
      >
        <ArrowLeft size={18} /> Return to Dashboard
      </Link>
    </div>
  );
}
