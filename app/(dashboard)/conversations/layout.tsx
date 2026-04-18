"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Conversation } from "@/lib/types";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { Search, MessageSquareOff } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/utils";

type FilterTab = "All" | "active" | "escalated" | "resolved";

const supabase = createClient();

export default function ConversationsLayout({ children }: { children: React.ReactNode }) {
  const { activeWorkspaceId, loading: workspaceLoading } = useWorkspace();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterTab>("All");
  const pathname = usePathname();

  useEffect(() => {
    async function loadData() {
      if (!activeWorkspaceId) {
        setConversations([]);
        setLoading(false);
        return;
      }

       const { data: convos } = await supabase
        .from("conversations")
        .select("id, customer_phone, customer_name, status, last_message, last_message_at")
        .eq("business_id", activeWorkspaceId)
        .order("last_message_at", { ascending: false });

      if (convos) {
        setConversations(convos as Conversation[]);
      }
      setLoading(false);
    }
    
    if (!workspaceLoading) {
      void loadData();
    }

    const channel = supabase.channel(`conversations_changes_${activeWorkspaceId || "none"}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          ...(activeWorkspaceId ? { filter: `business_id=eq.${activeWorkspaceId}` } : {}),
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setConversations((prev) => 
              prev.map(c => c.id === (payload.new as Conversation).id ? (payload.new as Conversation) : c)
                .sort((a, b) => new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime())
            );
          } else if (payload.eventType === 'INSERT') {
            setConversations((prev) => [(payload.new as Conversation), ...prev]);
          }
        }
      ).subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeWorkspaceId, workspaceLoading]);

  const maskPhone = (phone: string) => {
    if (!phone || phone.length < 5) return phone;
    return phone.substring(0, 3) + " *** " + phone.substring(phone.length - 4);
  };

  const filteredData = conversations.filter(c => {
    const matchesFilter = filter === "All" || c.status === filter;
    const matchesSearch = 
      (c.customer_phone && c.customer_phone.includes(search)) || 
      (c.customer_name && c.customer_name.toLowerCase().includes(search.toLowerCase())) ||
      (c.last_message && c.last_message.toLowerCase().includes(search.toLowerCase()));
    
    return matchesFilter && matchesSearch;
  });

  // Determine if we should show the list on mobile based on route
  const isRootRoute = pathname === "/conversations";

  return (
    <div className="flex h-[calc(100vh-[var(--topbar-height)])] -mx-4 -mt-4 lg:mx-0 lg:mt-0 p-4 lg:p-0 gap-6">
      
      {/* Master List (Left Column - 25% on desktop, 100% on mobile when at root) */}
      <div 
        className={cn(
          "flex-col w-full xl:w-[320px] shrink-0 border-r border-border/50 xl:pr-4 h-full",
          isRootRoute ? "flex" : "hidden xl:flex"
        )}
      >
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-textPrimary">Inbox</h1>
        </div>
        
        <div className="relative w-full mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" size={16} />
          <input 
            type="text" 
            placeholder="Search messages..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm text-textPrimary focus:outline-none focus:border-primary focus:shadow-glow-primary transition-all"
          />
        </div>

        <div className="flex bg-background border border-border rounded-lg p-1 mb-4">
          {(["All", "active", "escalated", "resolved"] as FilterTab[]).map(tab => (
            <button 
              key={tab}
              onClick={() => setFilter(tab)}
              className={cn(
                "flex-1 py-1.5 text-xs font-medium rounded-md capitalize transition-all",
                filter === tab 
                  ? "bg-surface text-primary shadow-sm" 
                  : "text-textMuted hover:text-textPrimary"
              )}
            >
              {tab === "All" ? "All" : tab}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pb-20 xl:pb-0 pr-1 custom-scrollbar">
          {loading || workspaceLoading ? (
            <div className="flex flex-col gap-2 animate-pulse">
              {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-surface rounded-lg"></div>)}
            </div>
          ) : filteredData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <MessageSquareOff size={32} className="mb-3 text-border" />
              <p className="text-sm text-textMuted">No conversations found</p>
            </div>
          ) : (
            <AnimatePresence>
              {filteredData.map((conv) => {
                const isActive = pathname === `/conversations/${conv.id}`;
                return (
                  <motion.div
                    key={conv.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Link 
                      href={`/conversations/${conv.id}`}
                      className={cn(
                        "flex flex-col p-3 rounded-lg border transition-all cursor-pointer block",
                        isActive 
                          ? "bg-primary/5 border-primary/30 shadow-glow-primary/10" 
                          : "bg-surface border-transparent hover:border-border hover:bg-surface/80"
                      )}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className={cn(
                          "font-semibold text-sm truncate pr-2",
                          isActive ? "text-primary" : "text-textPrimary"
                        )}>
                          {conv.customer_name || maskPhone(conv.customer_phone)}
                        </span>
                        <div className="flex items-center text-[10px] text-textMuted whitespace-nowrap shrink-0 pt-0.5">
                          {conv.last_message_at ? formatDistanceToNow(new Date(conv.last_message_at)) : 'Now'}
                        </div>
                      </div>
                      
                      <p className="text-xs text-textMuted truncate mb-2">
                        {conv.last_message || "New conversation started"}
                      </p>

                      <div className="flex justify-between items-center">
                         <StatusBadge status={conv.status} />
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Detail View Container (Right Area) - Hides on mobile if on root routing */}
      <div className={cn(
        "flex-1 h-full min-w-0 xl:flex", 
        isRootRoute ? "hidden xl:flex" : "flex"
      )}>
        {children}
      </div>

    </div>
  );
}
