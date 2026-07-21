"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  MessageSquare, 
  Users, 
  Settings, 
  Zap
} from "lucide-react";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { Logo } from "@/components/ui/Logo";

export default function Sidebar() {
  const pathname = usePathname();
  const { workspaces, activeWorkspaceId } = useWorkspace();
  const activeWorkspace = workspaces.find((w) => w.businessId === activeWorkspaceId);

  const mainLinks = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, badge: null, mobileLabel: "Dashboard" },
    { name: "Conversations", href: "/conversations", icon: MessageSquare, badge: "Live", mobileLabel: "Chats" },
    { name: "Leads", href: "/leads", icon: Users, badge: null, mobileLabel: "Leads" },
  ];

  const systemLinks = [
    { name: "Settings & AI Rules", href: "/settings", icon: Settings, badge: null, mobileLabel: "Settings" },
  ];

  const allMobileLinks = [...mainLinks, ...systemLinks];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-[240px] bg-[#090a10] border-r border-border/80 h-full text-textPrimary shrink-0 select-none">
        
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-border/60">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <Logo size="sm" />
          </Link>

          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-[9px] font-mono text-accent font-bold">
            <Zap size={10} />
            <span>PRO</span>
          </div>
        </div>

        {/* Active Workspace Info Banner */}
        <div className="px-3 py-3 border-b border-border/40 bg-surface/30">
          <div className="p-2.5 rounded-xl bg-surface border border-border flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-accent/20 border border-accent/40 flex items-center justify-center font-bold text-[10px] text-accent uppercase">
              {activeWorkspace?.name?.substring(0, 2) || "WS"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-textPrimary truncate">
                {activeWorkspace?.name || "My Workspace"}
              </div>
              <div className="text-[9px] text-textMuted flex items-center gap-1 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                <span>WhatsApp Cloud API</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Navigation Section */}
        <nav className="flex-grow px-3 py-4 space-y-6 overflow-y-auto">
          {/* Main Group */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-mono font-semibold uppercase tracking-widest text-textMuted">
              Workspace Operations
            </div>
            <div className="space-y-1">
              {mainLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname.startsWith(link.href);
                return (
                  <Link 
                    key={link.name} 
                    href={link.href}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-200 text-xs font-medium ${
                      isActive 
                        ? "bg-accent/10 text-textPrimary border border-accent/30 shadow-glow-primary/20 font-semibold" 
                        : "text-textMuted border border-transparent hover:bg-white/[0.03] hover:text-textPrimary"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon size={15} className={isActive ? "text-accent" : "text-textMuted"} />
                      <span>{link.name}</span>
                    </div>
                    {link.badge && (
                      <span className="text-[9px] font-mono uppercase font-bold px-1.5 py-0.5 rounded bg-accent/20 text-accent border border-accent/30">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* System Group */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-mono font-semibold uppercase tracking-widest text-textMuted">
              Configuration
            </div>
            <div className="space-y-1">
              {systemLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname.startsWith(link.href);
                return (
                  <Link 
                    key={link.name} 
                    href={link.href}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all duration-200 text-xs font-medium ${
                      isActive 
                        ? "bg-accent/10 text-textPrimary border border-accent/30 shadow-glow-primary/20 font-semibold" 
                        : "text-textMuted border border-transparent hover:bg-white/[0.03] hover:text-textPrimary"
                    }`}
                  >
                    <Icon size={15} className={isActive ? "text-accent" : "text-textMuted"} />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Footer Area: Message Quota Usage */}
        <div className="p-3 border-t border-border/60 bg-surface/20">
          <div className="p-3 bg-surface border border-border rounded-xl flex flex-col gap-2">
            <div className="flex justify-between items-center text-[10px] text-textMuted font-mono">
              <span>Monthly Quota</span>
              <span className="font-bold text-accent">1,000 Msgs</span>
            </div>
            <div className="w-full h-1.5 bg-background rounded-full overflow-hidden">
              <div className="h-full bg-accent rounded-full w-[34%]" />
            </div>
            <div className="flex items-center justify-between text-[9px] text-textMuted">
              <span>340 processed</span>
              <span className="text-emerald-400 font-semibold">66% remaining</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation — Native app-quality tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#090a10]/95 backdrop-blur-lg border-t border-border z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="flex items-center justify-around px-1 py-1.5">
          {allMobileLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname.startsWith(link.href);
            return (
              <Link 
                key={link.name} 
                href={link.href}
                className={`flex flex-col items-center justify-center gap-0.5 py-1 px-1.5 rounded-xl transition-all flex-1 max-w-[80px] min-h-[44px] ${
                  isActive 
                    ? "text-accent font-bold bg-accent/10" 
                    : "text-textMuted active:text-textPrimary"
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] leading-tight tracking-tight">{link.mobileLabel}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
