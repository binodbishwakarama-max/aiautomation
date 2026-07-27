"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Conversation } from "@/lib/types";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { 
  MessageSquare, 
  Users, 
  CheckCircle2, 
  AlertTriangle,
  Plus,
  ArrowUpRight,
  Clock,
  TrendingUp,
  Sliders,
  ChevronRight,
  Activity
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { VolumeChart } from "@/components/dashboard/VolumeChart";
import { StatusDonutChart } from "@/components/dashboard/StatusDonutChart";
import AiSimulatorWidget from "@/components/dashboard/AiSimulatorWidget";
import type { FAQ } from "@/lib/types";

const supabase = createClient();

export default function DashboardPage() {
  const { activeWorkspaceId, loading: workspaceLoading } = useWorkspace();
  const [loading, setLoading] = useState(true);
  const [businessName, setBusinessName] = useState("ReplySync Workspace");
  const [faqs, setFaqs] = useState<FAQ[]>([]);
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

        // Fetch Business & FAQs
        const [{ data: bizData }, { data: faqsData }, { data: convos }, { data: leads }] = await Promise.all([
          supabase.from("businesses").select("name").eq("id", activeWorkspaceId).maybeSingle(),
          supabase.from("faqs").select("id, business_id, question, answer, display_order, created_at").eq("business_id", activeWorkspaceId).order("display_order", { ascending: true }),
          supabase.from("conversations").select("id, customer_phone, customer_name, status, last_message, last_message_at").eq("business_id", activeWorkspaceId).order("last_message_at", { ascending: false }),
          supabase.from("leads").select("status, created_at").eq("business_id", activeWorkspaceId),
        ]);

        if (bizData?.name) {
          setBusinessName(bizData.name);
        }

        if (faqsData) {
          setFaqs(faqsData as FAQ[]);
        }

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

  const maskPhone = (phone: string) => {
    if (!phone || phone.length < 5) return phone;
    return phone.substring(0, 3) + " *** " + phone.substring(phone.length - 4);
  };

  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-0.5 bg-accent/10 text-accent text-[10px] uppercase font-mono font-bold rounded-md border border-accent/20">AI Active</span>;
      case 'resolved':
        return <span className="px-2 py-0.5 bg-slate-500/10 text-slate-400 text-[10px] uppercase font-mono font-bold rounded-md border border-slate-500/20">Resolved</span>;
      case 'escalated':
        return <span className="px-2 py-0.5 bg-red-500/10 text-red-400 text-[10px] uppercase font-mono font-bold rounded-md border border-red-500/20">Escalated</span>;
      default:
        return <span className="px-2 py-0.5 bg-surface text-textMuted text-[10px] uppercase font-mono font-bold rounded-md border border-border">{status}</span>;
    }
  };

  if (loading || workspaceLoading) {
    return (
      <div className="flex flex-col gap-6 w-full h-full animate-pulse p-6 max-w-7xl mx-auto">
        <div className="h-8 bg-surface/50 rounded-xl w-1/4 mb-2"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-28 bg-surface/50 rounded-2xl border border-border"></div>)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-surface/50 rounded-2xl border border-border"></div>
          <div className="h-96 bg-surface/50 rounded-2xl border border-border"></div>
        </div>
      </div>
    );
  }

  const totalLeadsCount = leadPipeline.new + leadPipeline.contacted + leadPipeline.enrolled + leadPipeline.lost;

  return (
    <div className="flex flex-col gap-4 sm:gap-6 p-4 sm:p-6 pb-24 max-w-7xl mx-auto">
      
      {/* Workspace Overview Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gradient">
            Operational Control Center
          </h1>
          <p className="text-xs text-textMuted mt-0.5">
            Real-time telemetry and automation performance for active workspace.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <Link href="/settings" className="btn-secondary text-xs justify-center">
            <Sliders size={14} />
            <span>Manage FAQ</span>
          </Link>
          <Link href="/conversations" className="btn-primary text-xs justify-center">
            <MessageSquare size={14} />
            <span>Live Inbox</span>
          </Link>
        </div>
      </div>
      
      {/* 1. METRIC KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1 */}
        <div className="glass-card p-5 rounded-2xl border border-border relative overflow-hidden group hover:border-accent/40 transition-all">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-medium text-textMuted">Conversations Today</span>
            <div className="w-8 h-8 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
              <MessageSquare size={16} />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <h2 className="text-3xl font-extrabold text-textPrimary tracking-tight">{stats.conversationsToday}</h2>
            <span className="flex items-center text-[11px] font-semibold text-accent bg-accent/10 px-2 py-0.5 rounded-full border border-accent/20">
              <ArrowUpRight size={12} className="mr-0.5"/> +14%
            </span>
          </div>
          <p className="text-[11px] text-textMuted mt-2 font-mono">Inbound Meta WhatsApp Webhooks</p>
        </div>

        {/* Card 2 */}
        <div className="glass-card p-5 rounded-2xl border border-border relative overflow-hidden group hover:border-blue-500/40 transition-all">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-medium text-textMuted">New Leads (7 Days)</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Users size={16} />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <h2 className="text-3xl font-extrabold text-textPrimary tracking-tight">{stats.leadsThisWeek}</h2>
            <span className="flex items-center text-[11px] font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
              <ArrowUpRight size={12} className="mr-0.5"/> +8%
            </span>
          </div>
          <p className="text-[11px] text-textMuted mt-2 font-mono">Captured via AI Intent Filter</p>
        </div>

        {/* Card 3 */}
        <div className="glass-card p-5 rounded-2xl border border-border relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-medium text-textMuted">Auto-Resolution Rate</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <h2 className="text-3xl font-extrabold text-textPrimary tracking-tight">{stats.resolveRate}%</h2>
            <span className="flex items-center text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <TrendingUp size={12} className="mr-0.5"/> Optimal
            </span>
          </div>
          <p className="text-[11px] text-textMuted mt-2 font-mono">Zero Human Agent Touch required</p>
        </div>

        {/* Card 4 */}
        <div className="glass-card p-5 rounded-2xl border border-border relative overflow-hidden group hover:border-red-500/40 transition-all">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-medium text-textMuted">Pending Escalations</span>
            <div className="w-8 h-8 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
              <AlertTriangle size={16} />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <h2 className="text-3xl font-extrabold text-textPrimary tracking-tight">{stats.escalations}</h2>
            {stats.escalations > 0 ? (
              <span className="text-[11px] font-bold text-red-400 px-2.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 animate-pulse">
                Action Required
              </span>
            ) : (
              <span className="text-[11px] font-mono text-accent bg-accent/10 px-2 py-0.5 rounded-full border border-accent/20">
                Queue Clean
              </span>
            )}
          </div>
          <p className="text-[11px] text-textMuted mt-2 font-mono">Complex or manual handoffs</p>
        </div>

      </div>

      {/* Interactive AI WhatsApp Simulator Sandbox */}
      <section className="w-full">
        <AiSimulatorWidget faqs={faqs} businessName={businessName} />
      </section>

      {/* 2. MAIN TELEMETRY GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Recent Conversations Feed */}
        <div className="lg:col-span-2 glass-card rounded-2xl overflow-hidden flex flex-col border border-border">
          <div className="px-4 sm:px-6 py-4 border-b border-border flex justify-between items-center bg-surface/40">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-accent" />
              <h2 className="font-bold text-xs uppercase tracking-wider text-textPrimary">Recent Live Threads</h2>
            </div>
            <Link href="/conversations" className="text-xs font-medium text-accent hover:underline flex items-center gap-1">
              <span>View All Conversations</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          <div className="flex-grow divide-y divide-border/50">
            {recentConvos.length === 0 ? (
              <div className="p-12 text-center text-textMuted text-xs font-mono">
                No active conversations detected in workspace yet.
              </div>
            ) : (
              recentConvos.map((conv) => (
                <Link key={conv.id} href={`/conversations/${conv.id}`} className="block px-4 sm:px-6 py-3 sm:py-4 hover:bg-white/[0.02] transition-colors group">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-grow pr-4">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-bold text-sm text-textPrimary group-hover:text-accent transition-colors truncate">
                          {conv.customer_name || maskPhone(conv.customer_phone)}
                        </span>
                        <StatusBadge status={conv.status} />
                      </div>
                      <p className="text-xs text-textMuted truncate leading-relaxed">
                        {conv.last_message || "No message content"}
                      </p>
                    </div>
                    <div className="flex items-center text-[10px] text-textMuted gap-1.5 shrink-0 font-mono">
                      <Clock size={11} />
                      {conv.last_message_at ? formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true }) : 'Never'}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Status Breakdown Donut */}
        <div className="glass-card rounded-2xl p-6 flex flex-col border border-border">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-xs uppercase tracking-wider text-textPrimary">Thread Telemetry</h2>
            <span className="text-[10px] font-mono text-textMuted">Live Snapshot</span>
          </div>
          <div className="flex-1 min-h-[260px] flex items-center justify-center">
            <StatusDonutChart conversations={allConvos} />
          </div>
        </div>

        {/* Volume Area Chart */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6 border border-border">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="font-bold text-xs uppercase tracking-wider text-textPrimary">Message Volume Trajectory</h2>
              <p className="text-[11px] text-textMuted">Inbound & outbound WhatsApp traffic over 7 days</p>
            </div>
            <span className="text-[10px] font-mono text-accent bg-accent/10 px-2.5 py-1 rounded-full border border-accent/20">
              ● Live 5m Sync
            </span>
          </div>
          <VolumeChart conversations={allConvos} />
        </div>

        {/* Lead Pipeline & Quick Controls */}
        <div className="flex flex-col gap-6 lg:col-span-1">
          
          {/* Lead Funnel */}
          <div className="glass-card rounded-2xl p-6 border border-border">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-xs uppercase tracking-wider text-textPrimary">Lead Conversion Funnel</h2>
              <Link href="/leads" className="text-[10px] font-mono text-accent hover:underline">
                Open Board
              </Link>
            </div>
            
            <div className="space-y-3">
              <div className="flex flex-col gap-1 p-3 rounded-xl bg-background border border-border">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-textPrimary flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    New Prospects
                  </span>
                  <span className="font-mono font-bold text-textPrimary">{leadPipeline.new}</span>
                </div>
                <div className="w-full h-1 bg-surface rounded-full overflow-hidden mt-1">
                  <div className="h-full bg-blue-400 rounded-full" style={{ width: totalLeadsCount ? `${(leadPipeline.new / totalLeadsCount) * 100}%` : '0%' }} />
                </div>
              </div>

              <div className="flex flex-col gap-1 p-3 rounded-xl bg-background border border-border">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-textPrimary flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    Contacted / Qualified
                  </span>
                  <span className="font-mono font-bold text-textPrimary">{leadPipeline.contacted}</span>
                </div>
                <div className="w-full h-1 bg-surface rounded-full overflow-hidden mt-1">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: totalLeadsCount ? `${(leadPipeline.contacted / totalLeadsCount) * 100}%` : '0%' }} />
                </div>
              </div>

              <div className="flex flex-col gap-1 p-3 rounded-xl bg-background border border-border">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-textPrimary flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    Enrolled / Closed
                  </span>
                  <span className="font-mono font-bold text-emerald-400">{leadPipeline.enrolled}</span>
                </div>
                <div className="w-full h-1 bg-surface rounded-full overflow-hidden mt-1">
                  <div className="h-full bg-emerald-400 rounded-full" style={{ width: totalLeadsCount ? `${(leadPipeline.enrolled / totalLeadsCount) * 100}%` : '0%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="glass-card rounded-2xl p-6 border border-border">
            <h2 className="font-bold text-xs uppercase tracking-wider text-textPrimary mb-3">Quick Controls</h2>
            <div className="flex flex-col gap-2.5">
              <Link href="/settings" className="btn-secondary text-xs w-full justify-start font-medium">
                <Plus size={14} className="text-accent" />
                <span>Add FAQ Knowledge Rule</span>
              </Link>
              <Link href="/leads" className="btn-secondary text-xs w-full justify-start font-medium">
                <Users size={14} className="text-blue-400" />
                <span>Export Qualified Leads CSV</span>
              </Link>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
