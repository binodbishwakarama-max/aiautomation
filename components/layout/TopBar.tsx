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
    <header className="h-20 bg-background border-b border-border flex items-center justify-between px-8">
      <h2 className="text-2xl font-bold capitalize text-textPrimary">
        {pageTitle}
      </h2>
      
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-textMuted">
            <Shield size={14} />
            {role || "member"}
          </div>

          <select
            value={activeWorkspaceId || ""}
            onChange={(event) => switchWorkspace(event.target.value)}
            disabled={loading || workspaces.length === 0}
            className="min-w-[220px] bg-surface border border-border rounded-xl px-4 py-2 text-sm text-textPrimary focus:outline-none focus:border-primary"
          >
            {workspaces.map((workspace) => (
              <option key={workspace.businessId} value={workspace.businessId}>
                {workspace.name}
              </option>
            ))}
          </select>
        </div>

        <div className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center text-textMuted overflow-hidden">
          <User size={20} />
        </div>

        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-textMuted hover:text-primary hover:border-primary transition-colors"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  );
}
