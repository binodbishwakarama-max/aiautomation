"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { Conversation } from "@/lib/types";
import { Search, Clock, MessageSquareOff } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

type FilterTab = "All" | "active" | "escalated" | "resolved";

const supabase = createClient();

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterTab>("All");
  


  useEffect(() => {
    let businessId: string;
    
    async function loadData() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      
      const { data: businessUsers } = await supabase
        .from("business_users")
        .select("business_id")
        .eq("user_id", userData.user.id);
        
      if (!businessUsers || businessUsers.length === 0) return;
      businessId = businessUsers[0].business_id;

       const { data: convos } = await supabase
        .from("conversations")
        .select("id, customer_phone, customer_name, status, last_message, last_message_at")
        .eq("business_id", businessId)
        .order("last_message_at", { ascending: false });

      if (convos) {
        setConversations(convos as Conversation[]);
      }
      setLoading(false);
    }
    
    loadData();

    // Setup realtime subscription
    const channel = supabase.channel('conversations_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations' },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setConversations((prev) => 
              prev.map(c => c.id === (payload.new as Conversation).id ? (payload.new as Conversation) : c)
                .sort((a, b) => new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime())
            );
          } else if (payload.eventType === 'INSERT') {
            setConversations((prev) => {
              return [payload.new as Conversation, ...prev];
            });
          }
        }
      ).subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case 'active':
        return <span className="px-3 py-1 bg-green-500/10 text-green-400 text-xs font-medium rounded-full border border-green-500/20">Active</span>;
      case 'resolved':
        return <span className="px-3 py-1 bg-gray-500/10 text-gray-400 text-xs font-medium rounded-full border border-gray-500/20">Resolved</span>;
      case 'escalated':
        return <span className="px-3 py-1 bg-amber-500/10 text-amber-400 text-xs font-medium rounded-full border border-amber-500/20">Escalated</span>;
      default:
        return <span className="px-3 py-1 bg-gray-500/10 text-gray-400 text-xs font-medium rounded-full border border-gray-500/20">{status}</span>;
    }
  };

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

  return (
    <div className="flex flex-col h-full gap-6 max-w-5xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold text-textPrimary">Conversations</h1>
        
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" size={18} />
          <input 
            type="text" 
            placeholder="Search by phone, name, or message..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-xl text-sm text-textPrimary focus:outline-none focus:border-primary focus:shadow-glow-primary transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-border pb-2">
        {(["All", "active", "escalated", "resolved"] as FilterTab[]).map(tab => (
          <button 
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors capitalize ${
              filter === tab 
                ? "text-primary border-b-2 border-primary -mb-[2px]" 
                : "text-textMuted hover:text-textPrimary"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col gap-3 animate-pulse">
          {[1,2,3,4,5].map(i => <div key={i} className="h-20 bg-surface rounded-xl"></div>)}
        </div>
      ) : filteredData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-textMuted bg-surface border border-border rounded-xl border-dashed">
          <MessageSquareOff size={48} className="mb-4 opacity-50" />
          <h3 className="text-lg font-medium text-textPrimary">No conversations found</h3>
          <p className="text-sm mt-1">Try adjusting your filters or wait for incoming messages.</p>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col gap-3"
        >
          {filteredData.map((conv, index) => (
            <motion.div
              key={conv.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link 
                href={`/conversations/${conv.id}`}
                className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-surface border border-border rounded-xl hover:border-primary/50 hover:shadow-glow-primary transition-all group gap-4"
              >
                <div className="flex flex-col gap-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-bold text-textPrimary truncate">{conv.customer_name || maskPhone(conv.customer_phone)}</span>
                    <StatusBadge status={conv.status} />
                  </div>
                  <p className="text-sm text-textMuted truncate">
                    {conv.last_message || "Started a new conversation"}
                  </p>
                </div>
                
                <div className="flex items-center gap-2 text-xs text-textMuted shrink-0">
                  <Clock size={14} />
                  {conv.last_message_at ? formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true }) : 'Just now'}
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
