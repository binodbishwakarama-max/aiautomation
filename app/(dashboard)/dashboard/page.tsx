"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { Conversation } from "@/lib/types";
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

const supabase = createClient();

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    conversationsToday: 0,
    leadsThisWeek: 0,
    resolveRate: 0,
    escalations: 0,
  });
  const [recentConvos, setRecentConvos] = useState<Conversation[]>([]);
  const [leadPipeline, setLeadPipeline] = useState({
    new: 0, contacted: 0, enrolled: 0, lost: 0
  });



  useEffect(() => {
    async function loadDashboardData() {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) return;
        
        // Use RPC or directly query businesses
        const { data: businessUsers } = await supabase
          .from("business_users")
          .select("business_id")
          .eq("user_id", userData.user.id);
          
        if (!businessUsers || businessUsers.length === 0) return;
        const businessId = businessUsers[0].business_id;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);

        // Fetch Conversations
        const { data: convos } = await supabase
          .from("conversations")
          .select("id, customer_phone, customer_name, status, last_message, last_message_at")
          .eq("business_id", businessId)
          .order("last_message_at", { ascending: false });

        // Fetch Leads
        const { data: leads } = await supabase
          .from("leads")
          .select("status, created_at")
          .eq("business_id", businessId);

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

          setRecentConvos((convos as Conversation[]).slice(0, 5));
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

    loadDashboardData();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const maskPhone = (phone: string) => {
    if (!phone || phone.length < 5) return phone;
    return phone.substring(0, 3) + " *** " + phone.substring(phone.length - 4);
  };

  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-1 bg-green-500/10 text-green-400 text-xs rounded-lg border border-green-500/20">Active</span>;
      case 'resolved':
        return <span className="px-2 py-1 bg-gray-500/10 text-gray-400 text-xs rounded-lg border border-gray-500/20">Resolved</span>;
      case 'escalated':
        return <span className="px-2 py-1 bg-amber-500/10 text-amber-400 text-xs rounded-lg border border-amber-500/20">Escalated</span>;
      default:
        return <span className="px-2 py-1 bg-gray-500/10 text-gray-400 text-xs rounded-lg border border-gray-500/20">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-8 w-full h-full animate-pulse">
        <div className="h-10 bg-surface rounded-xl w-1/4 mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-surface rounded-card border border-border"></div>)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 h-96 bg-surface rounded-card border border-border"></div>
          <div className="h-96 bg-surface rounded-card border border-border"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-10">
      
      {/* 1. Stats Row */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <motion.div variants={itemVariants} className="bg-surface p-6 rounded-card border border-border shadow-none hover:shadow-glow-primary hover:border-primary/50 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-textMuted font-medium text-sm">Conversations Today</h3>
            <div className="p-2 bg-primary/10 rounded-lg text-primary"><MessageSquare size={18} /></div>
          </div>
          <div className="flex items-end gap-3">
            <h2 className="text-3xl font-bold text-textPrimary">{stats.conversationsToday}</h2>
            <span className="flex items-center text-xs font-medium text-green-400 mb-1"><ArrowUpRight size={14} className="mr-1"/> 12%</span>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-surface p-6 rounded-card border border-border shadow-none hover:shadow-glow-primary hover:border-primary/50 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-textMuted font-medium text-sm">New Leads (Week)</h3>
            <div className="p-2 bg-primary/10 rounded-lg text-primary"><Users size={18} /></div>
          </div>
          <div className="flex items-end gap-3">
            <h2 className="text-3xl font-bold text-textPrimary">{stats.leadsThisWeek}</h2>
            <span className="flex items-center text-xs font-medium text-green-400 mb-1"><ArrowUpRight size={14} className="mr-1"/> 4%</span>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-surface p-6 rounded-card border border-border shadow-none hover:shadow-glow-primary hover:border-primary/50 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-textMuted font-medium text-sm">Auto-Resolved Rate</h3>
            <div className="p-2 bg-primary/10 rounded-lg text-primary"><CheckCircle size={18} /></div>
          </div>
          <div className="flex items-end gap-3">
            <h2 className="text-3xl font-bold text-textPrimary">{stats.resolveRate}%</h2>
            <span className="flex items-center text-xs font-medium text-green-400 mb-1"><ArrowUpRight size={14} className="mr-1"/> 2%</span>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-surface p-6 rounded-card border border-border shadow-none hover:shadow-glow-secondary hover:border-secondary/50 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-textMuted font-medium text-sm">Escalations Pending</h3>
            <div className="p-2 bg-secondary/10 rounded-lg text-secondary"><AlertCircle size={18} /></div>
          </div>
          <div className="flex items-end gap-3">
            <h2 className="text-3xl font-bold text-textPrimary">{stats.escalations}</h2>
            {stats.escalations > 0 ? (
              <span className="flex items-center text-xs font-medium text-amber-400 mb-1"><ArrowUpRight size={14} className="mr-1"/> Action Needed</span>
            ) : (
              <span className="flex items-center text-xs font-medium text-gray-400 mb-1">Clear</span>
            )}
          </div>
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* 2. Recent Conversations */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="xl:col-span-2 bg-surface rounded-card border border-border overflow-hidden flex flex-col"
        >
          <div className="p-6 border-b border-border flex justify-between items-center bg-background/30">
            <h2 className="font-bold text-lg text-textPrimary">Recent Conversations</h2>
            <Link href="/conversations" className="text-sm text-primary hover:underline font-medium">View All</Link>
          </div>
          <div className="flex-1 divide-y divide-border">
            {recentConvos.length === 0 ? (
              <div className="p-8 text-center text-textMuted">No conversations found.</div>
            ) : (
              recentConvos.map((conv) => (
                <Link key={conv.id} href={`/conversations/${conv.id}`} className="block p-5 hover:bg-white/5 transition-colors group">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-semibold text-textPrimary">{conv.customer_name || maskPhone(conv.customer_phone)}</span>
                        <StatusBadge status={conv.status} />
                      </div>
                      <p className="text-sm text-textMuted line-clamp-1">{conv.last_message || "No message content"}</p>
                    </div>
                    <div className="flex items-center text-xs text-textMuted gap-1 shrink-0">
                      <Clock size={12} />
                      {conv.last_message_at ? formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true }) : 'Never'}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </motion.div>

        {/* 3. Lead Pipeline & 4. Quick Actions */}
        <div className="flex flex-col gap-8">
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-surface rounded-card border border-border p-6"
          >
            <h2 className="font-bold text-lg text-textPrimary mb-6 flex items-center justify-between">
              Lead Pipeline
              <Link href="/leads" className="text-xs font-medium px-2 py-1 rounded bg-border text-textMuted hover:text-textPrimary transition-colors">Expand</Link>
            </h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 rounded-xl bg-background border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                  <span className="text-sm font-medium text-textPrimary">New</span>
                </div>
                <span className="font-bold text-textPrimary">{leadPipeline.new}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-background border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                  <span className="text-sm font-medium text-textPrimary">Contacted</span>
                </div>
                <span className="font-bold text-textPrimary">{leadPipeline.contacted}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-background border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-400"></div>
                  <span className="text-sm font-medium text-textPrimary">Enrolled</span>
                </div>
                <span className="font-bold text-textPrimary">{leadPipeline.enrolled}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-background border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-400"></div>
                  <span className="text-sm font-medium text-textPrimary">Lost</span>
                </div>
                <span className="font-bold text-textPrimary">{leadPipeline.lost}</span>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-surface rounded-card border border-border p-6"
          >
            <h2 className="font-bold text-lg text-textPrimary mb-4">Quick Actions</h2>
            <div className="flex flex-col gap-3">
              <button className="flex items-center gap-3 p-3 text-sm font-medium text-textPrimary bg-background border border-border rounded-xl hover:border-primary hover:text-primary transition-all group w-full">
                <div className="p-1.5 bg-border group-hover:bg-primary/20 rounded-lg transition-colors"><Plus size={16} /></div>
                Add FAQ Rule
              </button>
              <Link href="/leads" className="flex items-center gap-3 p-3 text-sm font-medium text-textPrimary bg-background border border-border rounded-xl hover:border-primary hover:text-primary transition-all group w-full">
                <div className="p-1.5 bg-border group-hover:bg-primary/20 rounded-lg transition-colors"><List size={16} /></div>
                View All Leads
              </Link>
              <Link href="/settings" className="flex items-center gap-3 p-3 text-sm font-medium text-textPrimary bg-background border border-border rounded-xl hover:border-primary hover:text-primary transition-all group w-full">
                <div className="p-1.5 bg-border group-hover:bg-primary/20 rounded-lg transition-colors"><Settings size={16} /></div>
                WhatsApp Setup Guide
              </Link>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
