"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, MessageSquare, Users, Settings } from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  const links = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Conversations", href: "/conversations", icon: MessageSquare },
    { name: "Leads", href: "/leads", icon: Users },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <>
      {/* Desktop Sidebar (Linear-style dense sidebar) */}
      <aside className="hidden md:flex flex-col w-[220px] bg-[#0c0c12] border-r border-border h-full text-textPrimary shrink-0">
        
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-border/40">
          <div className="flex items-center gap-2">
            <span className="font-sans font-bold text-sm tracking-tight text-textPrimary">ReplySync</span>
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          </div>
        </div>
        
        {/* Navigation items list */}
        <nav className="flex-grow px-3 py-4 space-y-1 overflow-y-auto">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname.startsWith(link.href);
            return (
              <Link 
                key={link.name} 
                href={link.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors text-xs font-medium ${
                  isActive 
                    ? "bg-white/[0.04] text-textPrimary border border-border/80" 
                    : "text-textMuted border border-transparent hover:bg-white/[0.02] hover:text-textPrimary"
                }`}
              >
                <Icon size={14} className={isActive ? "text-primary" : "text-textMuted"} />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer Area with Muted Active Status */}
        <div className="p-4 border-t border-border/40">
          <div className="flex items-center gap-2 px-3 py-2 bg-white/[0.02] border border-border/60 rounded-lg">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
            </span>
            <span className="text-[10px] font-mono text-textMuted uppercase tracking-wider">Cloud Connected</span>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation (Quiet, Low Profile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0c0c12] border-t border-border flex items-center justify-around p-1 z-50 pb-safe">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname.startsWith(link.href);
          return (
            <Link 
              key={link.name} 
              href={link.href}
              className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-lg transition-colors ${
                isActive 
                  ? "text-primary bg-white/[0.02]" 
                  : "text-textMuted"
              }`}
            >
              <Icon size={16} />
              <span className="text-[9px] font-medium tracking-tight">{link.name}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
