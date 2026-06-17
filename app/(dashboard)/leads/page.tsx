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

  // Modals
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
  // Proper CSV escaping per RFC 4180
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
    // Optimistic update
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status: newStatus } : l));
    await supabase.from("leads").update({ status: newStatus }).eq("id", id);
  };

  // Open Drawer and Fetch history
  const openDrawer = async (lead: Lead) => {
    if (!activeWorkspaceId) {
      return;
    }

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
    contacted: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    enrolled: "bg-green-500/10 text-green-400 border-green-500/20",
    lost: "bg-red-500/10 text-red-500 border-red-500/20",
  };

  const filteredLeads = leads.filter(l => {
    const matchesStatus = statusFilter === "all" || l.status === statusFilter;
    const matchesSearch = 
      (l.name && l.name.toLowerCase().includes(search.toLowerCase())) || 
      (l.phone && l.phone.includes(search));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="relative flex flex-col h-full gap-6 p-6 pb-20">
      
      {/* Header & Stats */}
      <div className="flex flex-col gap-5">
        <div className="flex justify-between items-center">
          <h1 className="text-xs font-bold text-textPrimary uppercase tracking-wider">Lead Pipeline</h1>
          <div className="flex items-center gap-2">
            <button 
              onClick={exportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.02] border border-border text-xs text-textMuted hover:text-textPrimary hover:border-border/80 transition-colors rounded-lg font-medium"
            >
              <Download size={12} /> Export CSV
            </button>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-background rounded-lg font-bold hover:bg-primary/90 transition-colors text-xs shadow-none"
            >
              <Plus size={12} /> Add Lead
            </button>
          </div>
        </div>

        {/* Stats Bar (Stripe-style quiet border metric cards) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#0e0e14] p-4 rounded-xl border border-border">
            <p className="text-[10px] uppercase tracking-wider text-textMuted font-semibold mb-1">Total Leads</p>
            <h3 className="text-xl font-bold font-sans text-textPrimary tracking-tight">{metrics.total}</h3>
          </div>
          <div className="bg-[#0e0e14] p-4 rounded-xl border border-border">
            <p className="text-[10px] uppercase tracking-wider text-textMuted font-semibold mb-1">Enrolled</p>
            <h3 className="text-xl font-bold font-sans text-textPrimary tracking-tight">{metrics.enrolled}</h3>
          </div>
          <div className="bg-[#0e0e14] p-4 rounded-xl border border-border">
            <p className="text-[10px] uppercase tracking-wider text-textMuted font-semibold mb-1">Conversion Rate</p>
            <h3 className="text-xl font-bold font-sans text-textPrimary tracking-tight">{metrics.conversionRate}%</h3>
          </div>
          <div className="bg-[#0e0e14] p-4 rounded-xl border border-border">
            <p className="text-[10px] uppercase tracking-wider text-textMuted font-semibold mb-1">New This Month</p>
            <h3 className="text-xl font-bold font-sans text-textPrimary tracking-tight">{metrics.thisMonth}</h3>
          </div>
        </div>
      </div>

      {/* Tools Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-textMuted" size={14} />
          <input 
            type="text" 
            placeholder="Search leads..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-[#0e0e14] border border-border rounded-lg text-xs text-textPrimary focus:outline-none focus:border-border/80 transition-colors"
          />
        </div>
        <div className="flex items-center bg-[#0e0e14] rounded-lg p-0.5 border border-border w-full sm:w-auto overflow-x-auto">
          {["all", "new", "contacted", "enrolled", "lost"].map((stat) => (
            <button
              key={stat}
              onClick={() => setStatusFilter(stat)}
              className={`px-3 py-1 text-[10px] font-semibold rounded-md capitalize transition-colors whitespace-nowrap ${
                statusFilter === stat 
                  ? "bg-white/[0.04] text-textPrimary border border-border/60" 
                  : "text-textMuted hover:text-textPrimary"
              }`}
            >
              {stat}
            </button>
          ))}
        </div>
      </div>

      {/* Table Area */}
      <div className="bg-[#0e0e14] border border-border rounded-xl flex-grow overflow-hidden flex flex-col">
        {loading || workspaceLoading ? (
          <div className="p-6 flex flex-col gap-3 animate-pulse">
            <div className="h-6 bg-white/[0.02] rounded-lg w-1/4 mb-4"></div>
            {[1,2,3,4,5].map(i => <div key={i} className="h-10 bg-white/[0.02] rounded-lg"></div>)}
          </div>
        ) : leads.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No leads pipeline yet"
            description="Your first lead will appear here automatically when a student messages you on WhatsApp. Or you can manually add one to start tracking."
            action={
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="mt-4 px-4 py-2 bg-white/[0.04] text-textPrimary border border-border rounded-lg font-bold hover:bg-white/[0.06] transition-colors text-xs"
              >
                Add a Lead Manually
              </button>
            }
          />
        ) : (
          <>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs text-textPrimary">
              <thead className="bg-[#0e0e14] border-b border-border/60 font-semibold text-textMuted">
                <tr>
                  <th className="px-6 py-3 font-bold uppercase tracking-wider text-[10px]">Lead Name</th>
                  <th className="px-6 py-3 font-bold uppercase tracking-wider text-[10px]">Phone Number</th>
                  <th className="px-6 py-3 font-bold uppercase tracking-wider text-[10px]">Status</th>
                  <th className="px-6 py-3 font-bold uppercase tracking-wider text-[10px]">Source</th>
                  <th className="px-6 py-3 text-right font-bold uppercase tracking-wider text-[10px]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 relative">
                <AnimatePresence>
                  {filteredLeads.map((lead, idx) => (
                    <motion.tr 
                      key={lead.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      className="hover:bg-white/[0.01] transition-colors group cursor-pointer"
                      onClick={(e) => {
                        if ((e.target as HTMLElement).tagName.toLowerCase() !== 'select') {
                          openDrawer(lead)
                        }
                      }}
                    >
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-white/[0.04] border border-border text-textMuted flex items-center justify-center font-bold text-[10px]">
                            {lead.name ? lead.name.charAt(0).toUpperCase() : "?"}
                          </div>
                          <div>
                            <p className="font-semibold text-textPrimary text-xs">{lead.name || "Unknown"}</p>
                            <p className="text-[10px] text-textMuted">
                              Added {format(new Date(lead.created_at), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3 font-mono text-textMuted text-[11px]">{lead.phone}</td>
                      <td className="px-6 py-3">
                        <select 
                          value={lead.status}
                          onChange={(e) => updateStatus(lead.id, e.target.value as LeadStatus)}
                          className={`appearance-none bg-[#0c0c12] outline-none px-2.5 py-1 rounded-md border text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors ${statusColors[lead.status] || statusColors.new}`}
                        >
                          <option value="new" className="text-textPrimary bg-[#0c0c12]">NEW</option>
                          <option value="contacted" className="text-textPrimary bg-[#0c0c12]">CONTACTED</option>
                          <option value="enrolled" className="text-textPrimary bg-[#0c0c12]">ENROLLED</option>
                          <option value="lost" className="text-textPrimary bg-[#0c0c12]">LOST</option>
                        </select>
                      </td>
                      <td className="px-6 py-3">
                        <span className="capitalize px-2 py-0.5 bg-white/[0.02] border border-border text-textMuted rounded text-[10px]">
                          {lead.source}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <button 
                          className="px-2.5 py-1 text-[10px] font-medium text-textMuted border border-border rounded-lg bg-background hover:text-textPrimary transition-colors flex items-center gap-1.5 ml-auto"
                        >
                          View <ChevronRight size={10}/>
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
                {filteredLeads.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-textMuted text-xs">
                      No leads match your current search constraints.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Mobile Leads List */}
          <div className="block md:hidden p-4 space-y-3">
             <AnimatePresence>
                {filteredLeads.map((lead) => (
                  <motion.div
                      key={`mob-${lead.id}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="bg-background border border-border p-3.5 rounded-xl flex flex-col gap-3"
                  >
                      <div className="flex justify-between items-start" onClick={() => openDrawer(lead)}>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-white/[0.04] border border-border text-textMuted flex items-center justify-center font-bold text-xs">
                            {lead.name ? lead.name.charAt(0).toUpperCase() : "?"}
                          </div>
                          <div>
                            <p className="font-semibold text-xs text-textPrimary">{lead.name || "Unknown"}</p>
                            <p className="text-[10px] text-textMuted font-mono">{lead.phone}</p>
                          </div>
                        </div>
                        <button className="p-1 text-textMuted"><ChevronRight size={14}/></button>
                      </div>
                      <div className="flex justify-between items-center bg-[#0c0c12] p-2 rounded-lg border border-border/60">
                         <select 
                            value={lead.status}
                            onChange={(e) => updateStatus(lead.id, e.target.value as LeadStatus)}
                            className={`appearance-none bg-[#0c0c12] outline-none px-2 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wider cursor-pointer transition-colors ${statusColors[lead.status] || statusColors.new}`}
                          >
                            <option value="new" className="text-textPrimary bg-[#0c0c12]">NEW</option>
                            <option value="contacted" className="text-textPrimary bg-[#0c0c12]">CONTACTED</option>
                            <option value="enrolled" className="text-textPrimary bg-[#0c0c12]">ENROLLED</option>
                            <option value="lost" className="text-textPrimary bg-[#0c0c12]">LOST</option>
                          </select>
                         <span className="capitalize text-[9px] text-textMuted block">Source: {lead.source}</span>
                      </div>
                  </motion.div>
                ))}
            </AnimatePresence>
          </div>
          </>
        )}
      </div>

      {/* Add Lead Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-[#0c0c12] border border-border w-full max-w-sm rounded-xl p-5 relative"
            >
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="absolute top-4 right-4 text-textMuted hover:text-textPrimary transition-colors"
              >
                <X size={14} />
              </button>
              
              <h3 className="font-bold text-xs uppercase tracking-wider text-textPrimary mb-4">Add Manual Lead</h3>
              
              <form onSubmit={handleAddLead} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-textMuted mb-1.5">Lead Name</label>
                  <input 
                    type="text" 
                    required
                    value={newLeadName}
                    onChange={(e) => setNewLeadName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-textPrimary focus:outline-none focus:border-border/80 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-textMuted mb-1.5">Phone Number (with country code)</label>
                  <input 
                    type="text" 
                    required
                    value={newLeadPhone}
                    onChange={(e) => setNewLeadPhone(e.target.value)}
                    placeholder="+91..."
                    className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-textPrimary focus:outline-none focus:border-border/80 font-mono"
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={addingLead}
                  className="w-full py-2 bg-primary text-background font-bold rounded-lg mt-2 hover:bg-primary/95 transition-colors disabled:opacity-50 text-xs"
                >
                  {addingLead ? 'Adding...' : 'Save Lead'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Drawer Overlay for Lead Details */}
      <AnimatePresence>
        {isDrawerOpen && selectedLead && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 250 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-[#0c0c12] border-l border-border/80 z-50 flex flex-col shadow-2xl"
            >
              <div className="p-5 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/[0.04] border border-border text-textMuted flex items-center justify-center font-bold text-xs">
                    {selectedLead.name ? selectedLead.name.charAt(0).toUpperCase() : "?"}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-textPrimary leading-tight">{selectedLead.name}</h3>
                    <p className="text-[10px] font-mono text-textMuted">{selectedLead.phone}</p>
                  </div>
                </div>
                <button onClick={() => setIsDrawerOpen(false)} className="p-1.5 hover:bg-white/[0.04] rounded-md text-textMuted hover:text-textPrimary transition-colors">
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 bg-[#08080c]">
                <h4 className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-textMuted mb-4 border-b border-border/40 pb-2">
                  <MessageSquare size={12} /> Conversation History
                </h4>
                
                {drawerLoading ? (
                  <div className="text-center py-8 text-xs text-textMuted animate-pulse">Loading thread...</div>
                ) : drawerMessages.length === 0 ? (
                  <div className="text-center py-8 text-xs text-textMuted">
                    No WhatsApp history associated with this phone number.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {drawerMessages.map(msg => {
                      const isAI = msg.role === 'assistant';
                      return (
                        <div key={msg.id} className={`flex flex-col ${isAI ? 'items-end' : 'items-start'}`}>
                          <div className={`p-2.5 rounded-lg max-w-[80%] text-xs leading-normal ${isAI ? 'bg-[#0c0c12] border border-primary/20 text-primary rounded-tr-none' : 'bg-white/[0.01] border border-border text-textPrimary rounded-tl-none'}`}>
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
                <div className="p-5 border-t border-border bg-[#0c0c12] shrink-0 max-h-40 overflow-y-auto">
                  <span className="text-[9px] font-bold text-textMuted uppercase mb-1.5 block tracking-wider">Captured Notes</span>
                  <div className="text-xs text-textPrimary whitespace-pre-wrap leading-relaxed">
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
