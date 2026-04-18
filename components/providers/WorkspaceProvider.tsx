"use client";

import {
  useCallback,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { createClient } from "@/lib/supabase/client";
import type { BusinessRole, WorkspaceMembership } from "@/lib/types";

type WorkspaceSummary = {
  businessId: string;
  name: string;
  role: BusinessRole;
  planKey: string;
  seatLimit: number;
  monthlyMessageLimit: number;
};

type WorkspaceContextValue = {
  workspaces: WorkspaceSummary[];
  activeWorkspaceId: string | null;
  activeWorkspace: WorkspaceSummary | null;
  role: BusinessRole | null;
  loading: boolean;
  switchWorkspace: (workspaceId: string) => void;
  refreshWorkspaces: () => Promise<void>;
  canManageWorkspace: boolean;
};

const ACTIVE_WORKSPACE_STORAGE_KEY = "replysync_active_workspace_id";
const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);
const supabase = createClient();

function mapMemberships(memberships: WorkspaceMembership[]) {
  return memberships
    .map((membership) => {
      if (!membership.businesses) {
        return null;
      }

      return {
        businessId: membership.business_id,
        name: membership.businesses.name,
        role: membership.role,
        planKey: membership.businesses.plan_key,
        seatLimit: membership.businesses.seat_limit,
        monthlyMessageLimit: membership.businesses.monthly_message_limit,
      } satisfies WorkspaceSummary;
    })
    .filter(Boolean) as WorkspaceSummary[];
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshWorkspaces = useCallback(async () => {
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setWorkspaces([]);
        setActiveWorkspaceId(null);
        return;
      }

      const defaultBusinessName =
        typeof user.user_metadata?.business_name === "string"
          ? user.user_metadata.business_name
          : typeof user.user_metadata?.name === "string"
            ? `${user.user_metadata.name}'s Workspace`
            : null;

      await supabase.rpc("ensure_business_for_current_user", {
        default_business_name: defaultBusinessName,
      });

      const { data: memberships, error } = await supabase
        .from("business_users")
        .select("business_id, user_id, role, created_at, businesses(id, name, plan_key, seat_limit, monthly_message_limit)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (error) {
        throw error;
      }

      const mapped = mapMemberships((memberships || []) as unknown as WorkspaceMembership[]);
      setWorkspaces(mapped);

      const storedWorkspaceId =
        typeof window !== "undefined"
          ? window.localStorage.getItem(ACTIVE_WORKSPACE_STORAGE_KEY)
          : null;

      const nextWorkspaceId =
        mapped.find((workspace) => workspace.businessId === storedWorkspaceId)?.businessId ||
        mapped[0]?.businessId ||
        null;

      setActiveWorkspaceId(nextWorkspaceId);

      if (typeof window !== "undefined" && nextWorkspaceId) {
        window.localStorage.setItem(ACTIVE_WORKSPACE_STORAGE_KEY, nextWorkspaceId);
      }
    } catch (error) {
      console.error("Failed to load workspaces:", error);
      setWorkspaces([]);
      setActiveWorkspaceId(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshWorkspaces();
  }, [refreshWorkspaces]);

  const switchWorkspace = useCallback((workspaceId: string) => {
    setActiveWorkspaceId(workspaceId);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ACTIVE_WORKSPACE_STORAGE_KEY, workspaceId);
    }
  }, []);

  const activeWorkspace =
    workspaces.find((workspace) => workspace.businessId === activeWorkspaceId) || null;

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      workspaces,
      activeWorkspaceId,
      activeWorkspace,
      role: activeWorkspace?.role || null,
      loading,
      switchWorkspace,
      refreshWorkspaces,
      canManageWorkspace:
        activeWorkspace?.role === "owner" || activeWorkspace?.role === "admin",
    }),
    [activeWorkspace, activeWorkspaceId, loading, refreshWorkspaces, switchWorkspace, workspaces]
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within WorkspaceProvider");
  }

  return context;
}
