"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Conversation } from "@/lib/types";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { Search, MessageSquareOff, MessageSquare } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
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

  const isRootRoute = pathname === "/conversations";

  const StatusPill = ({ status }: { status: string }) => {
    switch (status) {
      case 'active':
        return <span className="text-[9px] font-mono font-bold text-accent bg-accent/10 border border-accent/20 px-1.5 py-0.5 rounded">AI AUTO</span>;
      case 'escalated':
        return <span className="text-[9px] font-mono font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded animate-pulse">ESCALATED</span>;
      case 'resolved':
        return <span className="text-[9px] font-mono font-bold text-slate-400 bg-slate-500/10 border border-slate-500/20 px-1.5 py-0.5 rounded">RESOLVED</span>;
      default:
        return <span className="text-[9px] font-mono font-bold text-textMuted bg-surface border border-border px-1.5 py-0.5 rounded">{status}</span>;
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem-60px)] md:h-[calc(100vh-4rem)] p-3 sm:p-4 lg:p-6 gap-4 sm:gap-6 max-w-7xl mx-auto w-full">
      
      {/* Master List Column */}
      <div 
        className={cn(
          "flex-col w-full xl:w-[340px] shrink-0 border-r border-border/60 xl:pr-6 h-full select-none",
          isRootRoute ? "flex" : "hidden xl:flex"
        )}
      >
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <MessageSquare size={16} className="text-accent" />
            <h1 className="text-xs font-bold text-textPrimary uppercase tracking-wider font-mono">
              Live Inbox ({filteredData.length})
            </h1>
          </div>
          <span className="text-[10px] font-mono text-accent bg-accent/10 px-2 py-0.5 rounded-full border border-accent/20">
            ● Realtime Sync
          </span>
        </div>
        
        {/* Search */}
        <div className="relative w-full mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" size={14} />
          <input 
            type="text" 
            placeholder="Search phone, name or content..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-surface border border-border rounded-xl text-xs text-textPrimary focus:outline-none focus:border-accent/40 transition-colors"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex bg-surface border border-border rounded-xl p-1 mb-4">
          {(["All", "active", "escalated", "resolved"] as FilterTab[]).map(tab => (
            <button 
              key={tab}
              onClick={() => setFilter(tab)}
              className={cn(
                "flex-1 py-1 text-[10px] font-semibold rounded-lg capitalize transition-all font-mono",
                filter === tab 
                  ? "bg-accent/15 text-accent border border-accent/30 font-bold" 
                  : "text-textMuted hover:text-textPrimary"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Conversations Scroll Feed */}
        <div className="flex-grow overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {loading || workspaceLoading ? (
            <div className="flex flex-col gap-3 animate-pulse">
              {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-surface/50 rounded-xl border border-border"></div>)}
            </div>
          ) : filteredData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center glass-card rounded-2xl border border-border">
              <MessageSquareOff size={28} className="mb-2 text-textMuted opacity-50" />
              <p className="text-xs text-textMuted font-mono">No matching conversations</p>
            </div>
          ) : (
            <AnimatePresence>
              {filteredData.map((conv) => {
                const isActive = pathname === `/conversations/${conv.id}`;
                return (
                  <motion.div
                    key={conv.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Link 
                      href={`/conversations/${conv.id}`}
                      className={cn(
                        "flex flex-col p-3.5 rounded-xl border transition-all cursor-pointer block",
                        isActive 
                          ? "bg-accent/10 border-accent/40 text-textPrimary shadow-glow-primary/20" 
                          : "bg-surface/40 border-border hover:bg-surfaceHover hover:border-white/15"
                      )}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className={cn(
                          "font-bold text-xs truncate pr-2",
                          isActive ? "text-accent" : "text-textPrimary"
                        )}>
                          {conv.customer_name || maskPhone(conv.customer_phone)}
                        </span>
                        <span className="text-[9px] text-textMuted font-mono shrink-0">
                          {conv.last_message_at ? formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: false }) : 'Now'}
                        </span>
                      </div>
                      
                      <p className="text-[11px] text-textMuted truncate mb-2 leading-relaxed">
                        {conv.last_message || "New WhatsApp message..."}
                      </p>

                      <div className="flex justify-between items-center">
                        <StatusPill status={conv.status} />
                        <span className="text-[9px] text-textMuted font-mono">{conv.customer_phone.substring(0, 6)}...</span>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Detail View Pane */}
      <div className={cn(
        "flex-1 h-full min-w-0 xl:flex rounded-2xl glass-card overflow-hidden border border-border", 
        isRootRoute ? "hidden xl:flex" : "flex"
      )}>
        {children}
      </div>

    </div>
  );
}
