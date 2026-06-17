"use client";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Shield, User } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";

export default function TopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const pageTitle = pathname.split('/').filter(Boolean)[0] || "Dashboard";
  const { workspaces, activeWorkspaceId, switchWorkspace, role, loading } = useWorkspace();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="h-16 bg-[#08080c] border-b border-border flex items-center justify-between px-6 z-20 shrink-0">
      
      {/* Title */}
      <h2 className="text-sm font-bold text-textPrimary tracking-tight">
        {pageTitle}
      </h2>
      
      <div className="flex items-center gap-4">
        
        {/* Role & Workspace Select */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/[0.02] border border-border text-[9px] uppercase tracking-wider font-bold text-textMuted rounded-md select-none">
            <Shield size={10} className="text-primary" />
            {role || "member"}
          </div>

          <div className="relative">
            <select
              value={activeWorkspaceId || ""}
              onChange={(event) => switchWorkspace(event.target.value)}
              disabled={loading || workspaces.length === 0}
              className="appearance-none bg-white/[0.02] border border-border rounded-lg pl-3 pr-8 py-1.5 text-xs text-textPrimary focus:outline-none focus:border-border/80 transition-colors cursor-pointer select-none font-medium min-w-[180px]"
            >
              {workspaces.map((workspace) => (
                <option key={workspace.businessId} value={workspace.businessId} className="bg-[#0e0e14] text-textPrimary">
                  {workspace.name}
                </option>
              ))}
            </select>
            {/* Custom select dropdown pointer indicator */}
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] text-textMuted pointer-events-none">▼</span>
          </div>
        </div>

        {/* User Icon indicator */}
        <div className="w-8 h-8 rounded-full bg-white/[0.02] border border-border flex items-center justify-center text-textMuted overflow-hidden">
          <User size={14} />
        </div>

        {/* Sign Out Button */}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs text-textMuted hover:text-red-400 hover:border-red-400/20 hover:bg-red-400/5 transition-colors font-medium"
        >
          <LogOut size={12} />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  );
}
