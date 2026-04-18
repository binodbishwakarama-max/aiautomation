"use client";

import { MousePointerClick } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import Link from "next/link";
import { Spinner } from "@/components/ui/Spinner";

export default function ConversationsEmptyRoot() {
  const { activeWorkspaceId, loading } = useWorkspace();

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-surface border border-border rounded-xl">
        <Spinner size="lg" className="text-border" />
      </div>
    );
  }

  if (!activeWorkspaceId) {
    return (
      <div className="w-full h-full bg-surface border border-border rounded-xl flex items-center justify-center">
        <EmptyState
          icon={MousePointerClick}
          title="Setup Required"
          description="You need to connect an active WhatsApp Business Sandbox/App to view and receive messages."
          action={
            <Link href="/settings" className="px-4 py-2 bg-primary text-background rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity">
              Configure Settings
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="hidden xl:flex w-full h-full bg-surface border border-border rounded-xl items-center justify-center">
      <EmptyState
        icon={MousePointerClick}
        title="No conversation selected"
        description="Choose a conversation from the list on the left to view the message thread and lead details."
      />
    </div>
  );
}
