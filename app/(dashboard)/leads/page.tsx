"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { Lead, LeadStatus, Message } from "@/lib/types";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { 
  Download, 
  Search, 
  Plus, 
  X, 
  MessageSquare,
  Users,
  ChevronRight
} from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

const supabase = createClient();

export default function LeadsPage() {
  const { activeWorkspaceId, loading: workspaceLoading } = useWorkspace();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters & Search
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modals & Drawers
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Drawer State
  const [drawerMessages, setDrawerMessages] = useState<Message[]>([]);
  const [drawerLoading, setDrawerLoading] = useState(false);

  // Add Modal State
  const [newLeadName, setNewLeadName] = useState("");
  const [newLeadPhone, setNewLeadPhone] = useState("");
  const [addingLead, setAddingLead] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!activeWorkspaceId) {
        setLeads([]);
        setLoading(false);
        return;
      }

      const { data: leadsData } = await supabase
        .from("leads")
        .select("id, name, phone, status, source, notes, created_at")
        .eq("business_id", activeWorkspaceId)
        .order("created_at", { ascending: false });

      if (leadsData) {
        setLeads(leadsData as Lead[]);
      }
      setLoading(false);
    }
    
    if (!workspaceLoading) {
      void loadData();
    }
  }, [activeWorkspaceId, workspaceLoading]);

  // CSV escape
  const csvEscape = (val: string) => `"${(val || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`;

  // Handle Export CSV
  const exportCSV = () => {
    if (leads.length === 0) return;
    const headers = ["Name", "Phone", "Status", "Source", "Date", "Notes"];
    const csvContent = [
      headers.join(","),
      ...leads.map(l => [
        csvEscape(l.name),
        csvEscape(l.phone),
        csvEscape(l.status),
        csvEscape(l.source),
        csvEscape(l.created_at ? format(new Date(l.created_at), 'yyyy-MM-dd HH:mm') : ''),
        csvEscape(l.notes || '')
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `replysync_leads_${format(new Date(), 'yyyyMMdd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Inline Status Update
  const updateStatus = async (id: string, newStatus: LeadStatus) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status: newStatus } : l));
    await supabase.from("leads").update({ status: newStatus }).eq("id", id);
  };

  // Open Drawer and Fetch history
  const openDrawer = async (lead: Lead) => {
    if (!activeWorkspaceId) return;

    setSelectedLead(lead);
    setIsDrawerOpen(true);
    setDrawerLoading(true);
    setDrawerMessages([]);

    const { data: conv } = await supabase
      .from("conversations")
      .select("id")
      .eq("business_id", activeWorkspaceId)
      .eq("customer_phone", lead.phone)
      .single();

    if (conv) {
      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conv.id)
        .order("sent_at", { ascending: true });
      if (msgs) setDrawerMessages(msgs);
    }
    setDrawerLoading(false);
  };

  // Handle Add Lead
  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspaceId || !newLeadName || !newLeadPhone) return;
    setAddingLead(true);

    const { data: newLead } = await supabase.from("leads").insert({
      business_id: activeWorkspaceId,
      name: newLeadName,
      phone: newLeadPhone,
      status: 'new',
      source: 'manual'
    }).select().single();

    if (newLead) {
      setLeads([newLead, ...leads]);
      setIsAddModalOpen(false);
      setNewLeadName("");
      setNewLeadPhone("");
    }
    setAddingLead(false);
  };

  // Calculations
  const enrolledLeads = leads.filter(l => l.status === "enrolled").length;
  const metrics = {
    total: leads.length,
    enrolled: enrolledLeads,
    conversionRate: leads.length > 0 ? Math.round((enrolledLeads / leads.length) * 100) : 0,
    thisMonth: leads.filter(l => new Date(l.created_at).getMonth() === new Date().getMonth()).length
  };

  // Status Colors Mapping
  const statusColors: Record<string, string> = {
    new: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    contacted: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    enrolled: "bg-accent/10 text-accent border-accent/20",
    lost: "bg-red-500/10 text-red-400 border-red-500/20",
  };

  const filteredLeads = leads.filter(l => {
    const matchesStatus = statusFilter === "all" || l.status === statusFilter;
    const matchesSearch = 
      (l.name && l.name.toLowerCase().includes(search.toLowerCase())) || 
      (l.phone && l.phone.includes(search));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="flex flex-col h-full gap-4 sm:gap-6 p-4 sm:p-6 pb-24 max-w-7xl mx-auto w-full select-none">
      
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gradient">
            Lead Management Pipeline
          </h1>
          <p className="text-xs text-textMuted mt-0.5">
            Automated lead qualification and conversion tracking from WhatsApp inquiries.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <button 
            onClick={exportCSV}
            className="btn-secondary text-xs font-medium justify-center min-h-[44px] flex items-center"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="btn-primary text-xs justify-center min-h-[44px] flex items-center"
          >
            <Plus size={14} />
            <span>Add Manual Lead</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-2xl border border-border">
          <span className="text-[10px] font-mono uppercase tracking-wider text-textMuted block mb-1 font-semibold">Total Pipeline</span>
          <h3 className="text-2xl font-extrabold text-textPrimary tracking-tight">{metrics.total}</h3>
        </div>
        <div className="glass-card p-4 rounded-2xl border border-border">
          <span className="text-[10px] font-mono uppercase tracking-wider text-textMuted block mb-1 font-semibold">Enrolled / Won</span>
          <h3 className="text-2xl font-extrabold text-accent tracking-tight">{metrics.enrolled}</h3>
        </div>
        <div className="glass-card p-4 rounded-2xl border border-border">
          <span className="text-[10px] font-mono uppercase tracking-wider text-textMuted block mb-1 font-semibold">Conversion Rate</span>
          <h3 className="text-2xl font-extrabold text-emerald-400 tracking-tight">{metrics.conversionRate}%</h3>
        </div>
        <div className="glass-card p-4 rounded-2xl border border-border">
          <span className="text-[10px] font-mono uppercase tracking-wider text-textMuted block mb-1 font-semibold">New (This Month)</span>
          <h3 className="text-2xl font-extrabold text-blue-400 tracking-tight">{metrics.thisMonth}</h3>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" size={14} />
          <input 
            type="text" 
            placeholder="Search lead name or phone..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-surface border border-border rounded-xl text-base sm:text-xs text-textPrimary focus:outline-none focus:border-accent/40 transition-colors"
          />
        </div>
        
        <div className="flex items-center bg-surface border border-border rounded-xl p-1 w-full sm:w-auto overflow-x-auto">
          {["all", "new", "contacted", "enrolled", "lost"].map((stat) => (
            <button
              key={stat}
              onClick={() => setStatusFilter(stat)}
              className={`px-3 py-1 text-[10px] font-mono font-semibold rounded-lg capitalize transition-all whitespace-nowrap ${
                statusFilter === stat 
                  ? "bg-accent/15 text-accent border border-accent/30 font-bold" 
                  : "text-textMuted hover:text-textPrimary"
              }`}
            >
              {stat}
            </button>
          ))}
        </div>
      </div>

      {/* Leads Table Container */}
      <div className="glass-card border border-border rounded-2xl flex-grow overflow-hidden flex flex-col">
        {loading || workspaceLoading ? (
          <div className="p-6 flex flex-col gap-3 animate-pulse">
            {[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-surface/50 rounded-xl border border-border"></div>)}
          </div>
        ) : leads.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No leads in pipeline"
            description="Leads automatically get created when AI qualifies WhatsApp conversations, or you can add them manually."
            action={
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="btn-secondary text-xs mt-2"
              >
                Add Manual Lead
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            {/* Desktop Table — hidden below md */}
            <table className="w-full text-left text-xs text-textPrimary hidden md:table">
              <thead className="bg-surface/80 border-b border-border font-mono text-textMuted">
                <tr>
                  <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-[10px]">Lead Contact</th>
                  <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-[10px]">Phone Number</th>
                  <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-[10px]">Pipeline Status</th>
                  <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-[10px]">Source</th>
                  <th className="px-6 py-3.5 text-right font-bold uppercase tracking-wider text-[10px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                <AnimatePresence>
                  {filteredLeads.map((lead, idx) => (
                    <motion.tr 
                      key={lead.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                      onClick={(e) => {
                        if ((e.target as HTMLElement).tagName.toLowerCase() !== 'select') {
                          openDrawer(lead);
                        }
                      }}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-accent/15 border border-accent/30 text-accent font-bold flex items-center justify-center text-xs">
                            {lead.name ? lead.name.charAt(0).toUpperCase() : "?"}
                          </div>
                          <div>
                            <p className="font-bold text-textPrimary text-xs group-hover:text-accent transition-colors">{lead.name || "Unknown Lead"}</p>
                            <p className="text-[10px] text-textMuted font-mono">
                              Captured {format(new Date(lead.created_at), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-textMuted text-xs">{lead.phone}</td>
                      <td className="px-6 py-4">
                        <select 
                          value={lead.status}
                          onChange={(e) => updateStatus(lead.id, e.target.value as LeadStatus)}
                          className={`appearance-none bg-surface outline-none px-3 py-1 rounded-xl border text-[10px] font-mono font-bold uppercase tracking-wider cursor-pointer transition-colors ${statusColors[lead.status] || statusColors.new}`}
                        >
                          <option value="new" className="text-textPrimary bg-[#0e1018]">NEW</option>
                          <option value="contacted" className="text-textPrimary bg-[#0e1018]">CONTACTED</option>
                          <option value="enrolled" className="text-textPrimary bg-[#0e1018]">ENROLLED</option>
                          <option value="lost" className="text-textPrimary bg-[#0e1018]">LOST</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <span className="capitalize px-2.5 py-1 bg-surface border border-border text-textMuted rounded-xl text-[10px] font-mono">
                          {lead.source}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          className="px-3 py-1 text-[10px] font-medium text-textMuted border border-border rounded-xl bg-surface hover:text-textPrimary hover:border-white/15 transition-all inline-flex items-center gap-1"
                        >
                          <span>History</span>
                          <ChevronRight size={12}/>
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
                {filteredLeads.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-textMuted text-xs font-mono">
                      No leads matching filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Mobile Card View — shown only below md */}
            <div className="md:hidden divide-y divide-border/40">
              {filteredLeads.length === 0 ? (
                <div className="py-12 text-center text-textMuted text-xs font-mono">
                  No leads matching filter criteria.
                </div>
              ) : (
                <AnimatePresence>
                  {filteredLeads.map((lead, idx) => (
                    <motion.div
                      key={lead.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      className="p-4 active:bg-white/[0.02] transition-colors cursor-pointer"
                      onClick={() => openDrawer(lead)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-accent/15 border border-accent/30 text-accent font-bold flex items-center justify-center text-xs shrink-0">
                            {lead.name ? lead.name.charAt(0).toUpperCase() : "?"}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-textPrimary text-xs truncate">{lead.name || "Unknown Lead"}</p>
                            <p className="text-[10px] text-textMuted font-mono truncate">{lead.phone}</p>
                          </div>
                        </div>
                        <ChevronRight size={14} className="text-textMuted shrink-0 mt-1" />
                      </div>
                      <div className="flex items-center gap-2 mt-2.5 ml-12">
                        <select 
                          value={lead.status}
                          onChange={(e) => {
                            e.stopPropagation();
                            updateStatus(lead.id, e.target.value as LeadStatus);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className={`appearance-none bg-surface outline-none px-2.5 py-1 rounded-lg border text-[10px] font-mono font-bold uppercase tracking-wider cursor-pointer transition-colors ${statusColors[lead.status] || statusColors.new}`}
                        >
                          <option value="new" className="text-textPrimary bg-[#0e1018]">NEW</option>
                          <option value="contacted" className="text-textPrimary bg-[#0e1018]">CONTACTED</option>
                          <option value="enrolled" className="text-textPrimary bg-[#0e1018]">ENROLLED</option>
                          <option value="lost" className="text-textPrimary bg-[#0e1018]">LOST</option>
                        </select>
                        <span className="capitalize px-2 py-0.5 bg-surface border border-border text-textMuted rounded-lg text-[10px] font-mono">
                          {lead.source}
                        </span>
                        <span className="text-[10px] text-textMuted font-mono ml-auto">
                          {format(new Date(lead.created_at), 'MMM d')}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Lead Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card-accent w-full max-w-md rounded-2xl p-6 relative shadow-2xl"
            >
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="absolute top-5 right-5 text-textMuted hover:text-textPrimary transition-colors"
              >
                <X size={16} />
              </button>
              
              <h3 className="font-bold text-sm text-textPrimary mb-1">Add Manual Prospect Lead</h3>
              <p className="text-xs text-textMuted mb-6">Manually record a student or customer lead into your workspace pipeline.</p>
              
              <form onSubmit={handleAddLead} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-textMuted mb-1.5">Lead Full Name</label>
                  <input 
                    type="text" 
                    required
                    value={newLeadName}
                    onChange={(e) => setNewLeadName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full bg-background border border-border rounded-xl px-3.5 py-2 text-xs text-textPrimary focus:outline-none focus:border-accent/40"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-textMuted mb-1.5">WhatsApp Phone Number</label>
                  <input 
                    type="text" 
                    required
                    value={newLeadPhone}
                    onChange={(e) => setNewLeadPhone(e.target.value)}
                    placeholder="+91..."
                    className="w-full bg-background border border-border rounded-xl px-3.5 py-2 text-xs text-textPrimary focus:outline-none focus:border-accent/40 font-mono"
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={addingLead}
                  className="btn-primary w-full py-3 mt-4 text-xs font-bold"
                >
                  {addingLead ? 'Saving...' : 'Add Lead to Pipeline'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Drawer Overlay for History */}
      <AnimatePresence>
        {isDrawerOpen && selectedLead && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 250 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-[#090a10] border-l border-border z-50 flex flex-col shadow-2xl"
            >
              <div className="p-6 border-b border-border flex items-center justify-between bg-surface/50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-accent/15 border border-accent/30 text-accent font-bold flex items-center justify-center text-sm">
                    {selectedLead.name ? selectedLead.name.charAt(0).toUpperCase() : "?"}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-textPrimary leading-tight">{selectedLead.name}</h3>
                    <p className="text-[11px] font-mono text-textMuted">{selectedLead.phone}</p>
                  </div>
                </div>
                <button onClick={() => setIsDrawerOpen(false)} className="p-2 hover:bg-surface rounded-xl text-textMuted hover:text-textPrimary transition-colors">
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-background">
                <h4 className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-textMuted border-b border-border pb-3">
                  <MessageSquare size={14} className="text-accent" /> WhatsApp Conversation Feed
                </h4>
                
                {drawerLoading ? (
                  <div className="text-center py-12 text-xs text-textMuted animate-pulse font-mono">Loading history...</div>
                ) : drawerMessages.length === 0 ? (
                  <div className="text-center py-12 text-xs text-textMuted font-mono">
                    No transcript found for this contact.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {drawerMessages.map(msg => {
                      const isAI = msg.role === 'assistant';
                      return (
                        <div key={msg.id} className={`flex flex-col ${isAI ? 'items-end' : 'items-start'}`}>
                          <div className={`p-3 rounded-2xl max-w-[85%] text-xs leading-relaxed ${isAI ? 'bg-accent/15 border border-accent/30 text-textPrimary rounded-tr-xs' : 'bg-surface border border-border text-textPrimary rounded-tl-xs'}`}>
                            {msg.content}
                          </div>
                          <span className="text-[9px] text-textMuted mt-1 mx-1 font-mono">{format(new Date(msg.sent_at), 'MMM d, h:mm a')}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {selectedLead.notes && (
                <div className="p-6 border-t border-border bg-surface/40 shrink-0">
                  <span className="text-[10px] font-mono font-bold text-textMuted uppercase mb-2 block tracking-wider">AI Qualified Notes</span>
                  <div className="text-xs text-textPrimary leading-relaxed bg-background p-3 rounded-xl border border-border font-mono">
                    {selectedLead.notes}
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
