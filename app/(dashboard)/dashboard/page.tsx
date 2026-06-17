"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { Conversation } from "@/lib/types";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { 
  MessageSquare, 
  Users, 
  CheckCircle, 
  AlertCircle,
  Plus,
  List,
  Settings,
  ArrowUpRight,
  Clock
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { VolumeChart } from "@/components/dashboard/VolumeChart";
import { StatusDonutChart } from "@/components/dashboard/StatusDonutChart";

const supabase = createClient();

export default function DashboardPage() {
  const { activeWorkspaceId, loading: workspaceLoading } = useWorkspace();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    conversationsToday: 0,
    leadsThisWeek: 0,
    resolveRate: 0,
    escalations: 0,
  });
  const [recentConvos, setRecentConvos] = useState<Conversation[]>([]);
  const [allConvos, setAllConvos] = useState<Conversation[]>([]);
  const [leadPipeline, setLeadPipeline] = useState({
    new: 0, contacted: 0, enrolled: 0, lost: 0
  });



  useEffect(() => {
    async function loadDashboardData() {
      if (!activeWorkspaceId) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);

        // Fetch Conversations
        const { data: convos } = await supabase
          .from("conversations")
          .select("id, customer_phone, customer_name, status, last_message, last_message_at")
          .eq("business_id", activeWorkspaceId)
          .order("last_message_at", { ascending: false });

        // Fetch Leads
        const { data: leads } = await supabase
          .from("leads")
          .select("status, created_at")
          .eq("business_id", activeWorkspaceId);

        if (convos) {
          const typedConvos = convos;
          const convosToday = typedConvos.filter((c) => new Date(c.last_message_at || 0) >= today).length;
          const escalations = typedConvos.filter((c) => c.status === "escalated").length;
          const resolved = typedConvos.filter((c) => c.status === "resolved").length;
          const totalResolvedOrActive = typedConvos.filter((c) => c.status !== "escalated").length;
          const resolveRate = totalResolvedOrActive > 0 ? Math.round((resolved / totalResolvedOrActive) * 100) : 0;
          
          setStats({
            conversationsToday: convosToday,
            leadsThisWeek: (leads as { created_at: string }[])?.filter((l) => new Date(l.created_at) >= lastWeek).length || 0,
            resolveRate,
            escalations,
          });

          setAllConvos(typedConvos as Conversation[]);
          setRecentConvos((typedConvos as Conversation[]).slice(0, 5));
        }

        if (leads) {
          const leadData = leads as { status: string }[];
          setLeadPipeline({
            new: leadData.filter((l) => l.status === "new").length,
            contacted: leadData.filter((l) => l.status === "contacted").length,
            enrolled: leadData.filter((l) => l.status === "enrolled").length,
            lost: leadData.filter((l) => l.status === "lost").length,
          });
        }
      } catch (error) {
        console.error("Dashboard fetch error", error);
      } finally {
        setLoading(false);
      }
    }

    if (!workspaceLoading) {
      void loadDashboardData();
    }
  }, [activeWorkspaceId, workspaceLoading]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1 }
  };

  const maskPhone = (phone: string) => {
    if (!phone || phone.length < 5) return phone;
    return phone.substring(0, 3) + " *** " + phone.substring(phone.length - 4);
  };

  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-0.5 bg-green-500/10 text-green-400 text-[10px] uppercase tracking-wider font-bold rounded border border-green-500/10">Active</span>;
      case 'resolved':
        return <span className="px-2 py-0.5 bg-white/[0.04] text-textMuted text-[10px] uppercase tracking-wider font-bold rounded border border-border">Resolved</span>;
      case 'escalated':
        return <span className="px-2 py-0.5 bg-red-500/10 text-red-400 text-[10px] uppercase tracking-wider font-bold rounded border border-red-500/10">Escalated</span>;
      default:
        return <span className="px-2 py-0.5 bg-white/[0.04] text-textMuted text-[10px] uppercase tracking-wider font-bold rounded border border-border">{status}</span>;
    }
  };

  if (loading || workspaceLoading) {
    return (
      <div className="flex flex-col gap-6 w-full h-full animate-pulse p-6">
        <div className="h-6 bg-white/[0.02] rounded-lg w-1/4 mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-white/[0.02] rounded-xl border border-border"></div>)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-white/[0.02] rounded-xl border border-border"></div>
          <div className="h-80 bg-white/[0.02] rounded-xl border border-border"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6 pb-20">
      
      {/* 1. Stats Row */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <motion.div variants={itemVariants} className="bg-[#0e0e14] p-4 rounded-xl border border-border transition-colors">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-textMuted font-medium text-xs tracking-tight">Conversations Today</h3>
            <MessageSquare size={14} className="text-textMuted" />
          </div>
          <div className="flex items-baseline gap-2">
            <h2 className="text-2xl font-bold font-sans text-textPrimary tracking-tight">{stats.conversationsToday}</h2>
            <span className="flex items-center text-[10px] font-semibold text-green-400"><ArrowUpRight size={10} className="mr-0.5"/> +12%</span>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-[#0e0e14] p-4 rounded-xl border border-border transition-colors">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-textMuted font-medium text-xs tracking-tight">New Leads (Week)</h3>
            <Users size={14} className="text-textMuted" />
          </div>
          <div className="flex items-baseline gap-2">
            <h2 className="text-2xl font-bold font-sans text-textPrimary tracking-tight">{stats.leadsThisWeek}</h2>
            <span className="flex items-center text-[10px] font-semibold text-green-400"><ArrowUpRight size={10} className="mr-0.5"/> +4%</span>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-[#0e0e14] p-4 rounded-xl border border-border transition-colors">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-textMuted font-medium text-xs tracking-tight">Auto-Resolved Rate</h3>
            <CheckCircle size={14} className="text-textMuted" />
          </div>
          <div className="flex items-baseline gap-2">
            <h2 className="text-2xl font-bold font-sans text-textPrimary tracking-tight">{stats.resolveRate}%</h2>
            <span className="flex items-center text-[10px] font-semibold text-green-400"><ArrowUpRight size={10} className="mr-0.5"/> +2%</span>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-[#0e0e14] p-4 rounded-xl border border-border transition-colors">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-textMuted font-medium text-xs tracking-tight">Escalations Pending</h3>
            <AlertCircle size={14} className="text-textMuted" />
          </div>
          <div className="flex items-baseline gap-2">
            <h2 className="text-2xl font-bold font-sans text-textPrimary tracking-tight">{stats.escalations}</h2>
            {stats.escalations > 0 ? (
              <span className="text-[10px] font-bold text-red-400 px-1 py-0.5 rounded bg-red-500/5 ml-1">Action Needed</span>
            ) : (
              <span className="text-[10px] font-medium text-textMuted">Healthy</span>
            )}
          </div>
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 2. Recent Conversations */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 bg-[#0e0e14] rounded-xl border border-border overflow-hidden flex flex-col"
        >
          <div className="px-5 py-4 border-b border-border flex justify-between items-center">
            <h2 className="font-semibold text-xs text-textPrimary uppercase tracking-wider">Recent Conversations</h2>
            <Link href="/conversations" className="text-xs text-primary hover:text-primary/80 font-medium">View All</Link>
          </div>
          <div className="flex-grow divide-y divide-border/40">
            {recentConvos.length === 0 ? (
              <div className="p-8 text-center text-textMuted text-xs">No conversations found.</div>
            ) : (
              recentConvos.map((conv) => (
                <Link key={conv.id} href={`/conversations/${conv.id}`} className="block px-5 py-3.5 hover:bg-white/[0.01] transition-colors group">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-grow pr-4">
                      <div className="flex items-center gap-2.5 mb-1">
                        <span className="font-medium text-sm text-textPrimary truncate">{conv.customer_name || maskPhone(conv.customer_phone)}</span>
                        <StatusBadge status={conv.status} />
                      </div>
                      <p className="text-xs text-textMuted truncate">{conv.last_message || "No message content"}</p>
                    </div>
                    <div className="flex items-center text-[10px] text-textMuted gap-1 shrink-0">
                      <Clock size={10} />
                      {conv.last_message_at ? formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true }) : 'Never'}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </motion.div>

        {/* 3. Status Donut Chart */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="bg-[#0e0e14] rounded-xl border border-border p-5 flex flex-col"
        >
          <h2 className="font-semibold text-xs text-textPrimary uppercase tracking-wider mb-4">Status Breakdown</h2>
          <div className="flex-1 min-h-[260px]">
            <StatusDonutChart conversations={allConvos} />
          </div>
        </motion.div>

        {/* 4. Volume Area Chart */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-[#0e0e14] rounded-xl border border-border p-5"
        >
          <h2 className="font-semibold text-xs text-textPrimary uppercase tracking-wider mb-4">Volume (7 Days)</h2>
          <VolumeChart conversations={allConvos} />
        </motion.div>

        {/* 5. Lead Pipeline & Quick Actions */}
        <div className="flex flex-col gap-6 lg:col-span-1">
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="bg-[#0e0e14] rounded-xl border border-border p-5"
          >
            <h2 className="font-semibold text-xs text-textPrimary uppercase tracking-wider mb-4 flex items-center justify-between">
              Lead Pipeline
              <Link href="/leads" className="text-[10px] font-medium px-2 py-0.5 rounded bg-white/[0.04] border border-border text-textMuted hover:text-textPrimary transition-colors">Expand</Link>
            </h2>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center px-3 py-2 rounded-lg bg-background border border-border/40">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                  <span className="text-xs text-textPrimary">New</span>
                </div>
                <span className="text-xs font-bold text-textPrimary">{leadPipeline.new}</span>
              </div>
              <div className="flex justify-between items-center px-3 py-2 rounded-lg bg-background border border-border/40">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-400"></div>
                  <span className="text-xs text-textPrimary">Contacted</span>
                </div>
                <span className="text-xs font-bold text-textPrimary">{leadPipeline.contacted}</span>
              </div>
              <div className="flex justify-between items-center px-3 py-2 rounded-lg bg-background border border-border/40">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                  <span className="text-xs text-textPrimary">Enrolled</span>
                </div>
                <span className="text-xs font-bold text-textPrimary">{leadPipeline.enrolled}</span>
              </div>
              <div className="flex justify-between items-center px-3 py-2 rounded-lg bg-background border border-border/40">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
                  <span className="text-xs text-textPrimary">Lost</span>
                </div>
                <span className="text-xs font-bold text-textPrimary">{leadPipeline.lost}</span>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-[#0e0e14] rounded-xl border border-border p-5"
          >
            <h2 className="font-semibold text-xs text-textPrimary uppercase tracking-wider mb-3">Quick Actions</h2>
            <div className="flex flex-col gap-2">
              <button className="flex items-center gap-3 p-2.5 text-xs text-textPrimary bg-background border border-border/60 rounded-lg hover:border-border/100 hover:bg-white/[0.01] transition-all group w-full">
                <div className="p-1.5 bg-white/[0.04] rounded"><Plus size={12} /></div>
                Add FAQ Rule
              </button>
              <Link href="/leads" className="flex items-center gap-3 p-2.5 text-xs text-textPrimary bg-background border border-border/60 rounded-lg hover:border-border/100 hover:bg-white/[0.01] transition-all group w-full">
                <div className="p-1.5 bg-white/[0.04] rounded"><List size={12} /></div>
                View All Leads
              </Link>
              <Link href="/settings" className="flex items-center gap-3 p-2.5 text-xs text-textPrimary bg-background border border-border/60 rounded-lg hover:border-border/100 hover:bg-white/[0.01] transition-all group w-full">
                <div className="p-1.5 bg-white/[0.04] rounded"><Settings size={12} /></div>
                WhatsApp Setup Guide
              </Link>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
