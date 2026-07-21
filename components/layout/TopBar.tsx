"use client";

import { usePathname, useRouter } from "next/navigation";
import { 
  LogOut, 
  Shield, 
  Search, 
  Bell, 
  ChevronDown, 
  Building2, 
  Radio
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";

export default function TopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const rawPath = pathname.split('/').filter(Boolean)[0] || "dashboard";
  const pageTitle = rawPath.charAt(0).toUpperCase() + rawPath.slice(1);
  const { workspaces, activeWorkspaceId, switchWorkspace, role, loading } = useWorkspace();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="h-16 bg-[#08090f]/90 backdrop-blur-md border-b border-border flex items-center justify-between px-6 z-20 shrink-0 select-none">
      
      {/* Left: Breadcrumb & Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-mono text-textMuted">
          <span className="hover:text-textPrimary cursor-pointer">workspace</span>
          <span>/</span>
          <span className="text-textPrimary font-semibold font-sans">{pageTitle}</span>
        </div>
      </div>
      
      {/* Center: Search Trigger (Meta / Linear style) */}
      <div className="hidden lg:flex items-center">
        <div className="relative w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
          <input 
            type="text" 
            placeholder="Search conversations, leads, FAQs... (⌘K)" 
            readOnly
            className="w-full bg-surface/80 border border-border rounded-xl pl-9 pr-10 py-1.5 text-xs text-textMuted focus:outline-none cursor-pointer hover:border-white/15 transition-colors"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-textMuted bg-background px-1.5 py-0.5 rounded border border-border">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right Actions & Controls */}
      <div className="flex items-center gap-4">
        
        {/* Real-time Status Indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-accent/10 border border-accent/20 rounded-full text-[10px] font-mono text-accent">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
          <Radio size={12} />
          <span>Meta Webhook 200 OK</span>
        </div>

        {/* Workspace Selector */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={activeWorkspaceId || ""}
              onChange={(e) => switchWorkspace(e.target.value)}
              disabled={loading || workspaces.length === 0}
              className="appearance-none bg-surface hover:bg-surfaceHover border border-border rounded-xl pl-8 pr-8 py-1.5 text-xs font-medium text-textPrimary focus:outline-none focus:border-accent/40 transition-all cursor-pointer select-none min-w-[170px]"
            >
              {workspaces.map((ws) => (
                <option key={ws.businessId} value={ws.businessId} className="bg-[#0e1018] text-textPrimary">
                  {ws.name}
                </option>
              ))}
            </select>
            <Building2 size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-textMuted pointer-events-none" />
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-textMuted pointer-events-none" />
          </div>

          {/* User Role Badge */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 bg-surface border border-border text-[10px] font-mono uppercase font-bold text-textMuted rounded-xl">
            <Shield size={11} className="text-accent" />
            <span>{role || "owner"}</span>
          </div>
        </div>

        {/* Notifications Icon */}
        <button className="w-8 h-8 rounded-xl bg-surface border border-border flex items-center justify-center text-textMuted hover:text-textPrimary hover:bg-surfaceHover transition-colors relative">
          <Bell size={14} />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-accent" />
        </button>

        {/* Sign Out Button */}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs text-textMuted hover:text-red-400 hover:border-red-400/30 hover:bg-red-500/10 transition-all font-medium"
        >
          <LogOut size={13} />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  );
}
