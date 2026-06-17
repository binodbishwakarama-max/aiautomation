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
    <header className="h-20 bg-background/30 border-b border-white/5 backdrop-blur-xl flex items-center justify-between px-8 z-20">
      <h2 className="text-xl font-bold capitalize bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent tracking-tight">
        {pageTitle}
      </h2>
      
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-4">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/5 text-[10px] uppercase tracking-[0.18em] font-bold text-textMuted rounded-xl select-none">
            <Shield size={12} className="text-primary/70" />
            {role || "member"}
          </div>

          <select
            value={activeWorkspaceId || ""}
            onChange={(event) => switchWorkspace(event.target.value)}
            disabled={loading || workspaces.length === 0}
            className="min-w-[220px] bg-surface/50 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-textPrimary focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-all select-none"
          >
            {workspaces.map((workspace) => (
              <option key={workspace.businessId} value={workspace.businessId} className="bg-surface text-textPrimary">
                {workspace.name}
              </option>
            ))}
          </select>
        </div>

        <div className="w-10 h-10 rounded-full bg-surface/50 border border-white/5 flex items-center justify-center text-textMuted overflow-hidden hover:border-white/15 transition-colors duration-300">
          <User size={18} />
        </div>

        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/5 text-textMuted hover:text-red-400 hover:border-red-400/20 hover:bg-red-400/5 active:scale-95 transition-all duration-300 text-sm font-medium"
        >
          <LogOut size={14} />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  );
}
