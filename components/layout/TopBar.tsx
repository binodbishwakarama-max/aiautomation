"use client";
import { usePathname } from "next/navigation";
import { Bell, User } from "lucide-react";

export default function TopBar() {
  const pathname = usePathname();
  const pageTitle = pathname.split('/').filter(Boolean)[0] || "Dashboard";

  return (
    <header className="h-20 bg-background border-b border-border flex items-center justify-between px-8">
      <h2 className="text-2xl font-bold capitalize text-textPrimary">
        {pageTitle}
      </h2>
      
      <div className="flex items-center gap-6">
        <button className="text-textMuted hover:text-primary transition-colors relative">
          <Bell size={24} />
          <span className="absolute top-0 right-0 w-2 h-2 bg-primary rounded-full shadow-glow-primary"></span>
        </button>
        
        <div className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center text-textMuted overflow-hidden">
          <User size={20} />
        </div>
      </div>
    </header>
  );
}
