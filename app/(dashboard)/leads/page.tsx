"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { Lead, LeadStatus, Message } from "@/lib/types";
import { 
  Download, 
  Search, 
  Plus, 
  X, 
  MessageSquare,
  Users,
  TrendingUp,
  Award,
  ChevronRight,
  UserPlus,
  CheckCircle
} from "lucide-react";


const supabase = createClient();

export default function LeadsPage() {
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


  const [businessId, setBusinessId] = useState("");

  useEffect(() => {
    async function loadData() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      
      const { data: businessUsers } = await supabase
        .from("business_users")
        .select("business_id")
        .eq("user_id", userData.user.id);
        
      if (!businessUsers || businessUsers.length === 0) return;
      const bId = businessUsers[0].business_id;
      setBusinessId(bId);

      const { data: leadsData } = await supabase
        .from("leads")
        .select("id, name, phone, status, source, notes, created_at")
        .eq("business_id", bId)
        .order("created_at", { ascending: false });

      if (leadsData) {
        setLeads(leadsData as Lead[]);
      }
      setLoading(false);
    }
    
    loadData();
  }, []);
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
    setSelectedLead(lead);
    setIsDrawerOpen(true);
    setDrawerLoading(true);
    setDrawerMessages([]);

    const { data: conv } = await supabase
      .from("conversations")
      .select("id")
      .eq("business_id", businessId)
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
    if (!newLeadName || !newLeadPhone) return;
    setAddingLead(true);

    const { data: newLead } = await supabase.from("leads").insert({
      business_id: businessId,
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
    <div className="relative flex flex-col h-full gap-6 pb-10">
      
      {/* Header & Stats */}
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-textPrimary">Lead Pipeline</h1>
          <div className="flex items-center gap-3">
            <button 
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-surface border border-border text-textPrimary rounded-xl hover:text-primary hover:border-primary/50 transition-all text-sm font-medium"
            >
              <Download size={16} /> Export CSV
            </button>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-background rounded-xl font-bold hover:bg-opacity-90 transition-all shadow-glow-primary text-sm"
            >
              <Plus size={16} /> Add Lead
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-surface p-4 rounded-xl border border-border flex items-center gap-4">
            <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-lg"><Users size={20} /></div>
            <div>
              <p className="text-sm text-textMuted font-medium">Total Leads</p>
              <h3 className="text-xl font-bold text-textPrimary">{metrics.total}</h3>
            </div>
          </div>
          <div className="bg-surface p-4 rounded-xl border border-border flex items-center gap-4">
            <div className="p-2.5 bg-green-500/10 text-green-400 rounded-lg"><CheckCircle size={20} /></div>
            <div>
              <p className="text-sm text-textMuted font-medium">Enrolled</p>
              <h3 className="text-xl font-bold text-textPrimary">{metrics.enrolled}</h3>
            </div>
          </div>
          <div className="bg-surface p-4 rounded-xl border border-border flex items-center gap-4">
            <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-lg"><Award size={20} /></div>
            <div>
              <p className="text-sm text-textMuted font-medium">Conversion Rate</p>
              <h3 className="text-xl font-bold text-textPrimary">{metrics.conversionRate}%</h3>
            </div>
          </div>
          <div className="bg-surface p-4 rounded-xl border border-border flex items-center gap-4">
            <div className="p-2.5 bg-primary/10 text-primary rounded-lg"><TrendingUp size={20} /></div>
            <div>
              <p className="text-sm text-textMuted font-medium">New This Month</p>
              <h3 className="text-xl font-bold text-textPrimary">{metrics.thisMonth}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Tools Filter Bar */}
      <div className="bg-surface border border-border rounded-xl p-3 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" size={16} />
          <input 
            type="text" 
            placeholder="Search leads by name or phone..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm text-textPrimary focus:outline-none focus:border-primary transition-colors"
          />
        </div>
        <div className="flex items-center bg-background rounded-lg p-1 border border-border w-full md:w-auto overflow-x-auto">
          {["all", "new", "contacted", "enrolled", "lost"].map((stat) => (
            <button
              key={stat}
              onClick={() => setStatusFilter(stat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors whitespace-nowrap ${
                statusFilter === stat 
                  ? "bg-surface border border-border text-textPrimary shadow-sm" 
                  : "text-textMuted hover:text-textPrimary"
              }`}
            >
              {stat}
            </button>
          ))}
        </div>
      </div>

      {/* Table Area */}
      <div className="bg-surface border border-border rounded-xl flex-1 overflow-hidden flex flex-col min-h-[500px]">
        {loading ? (
          <div className="p-8 flex flex-col gap-4 animate-pulse">
            <div className="h-10 bg-background rounded-lg mb-4"></div>
            {[1,2,3,4,5].map(i => <div key={i} className="h-14 bg-background rounded-lg"></div>)}
          </div>
        ) : leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 text-center p-8">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6">
              <UserPlus size={40} />
            </div>
            <h2 className="text-xl font-bold text-textPrimary mb-2">No Leads Yet</h2>
            <p className="text-textMuted max-w-sm">
              Your first lead will appear here automatically when a student messages you on WhatsApp.
            </p>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="mt-6 px-6 py-2.5 bg-primary/10 text-primary border border-primary/20 rounded-xl font-bold hover:bg-primary/20 transition-all text-sm"
            >
              Add a Lead Manually
            </button>
          </div>
        ) : (
          <>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm text-textPrimary">
              <thead className="bg-background/80 border-b border-border font-semibold text-textMuted">
                <tr>
                  <th className="px-6 py-4 rounded-tl-xl w-[250px]">Lead Name</th>
                  <th className="px-6 py-4">Phone Number</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Source</th>
                  <th className="px-6 py-4 text-right rounded-tr-xl">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border relative">
                <AnimatePresence>
                  {filteredLeads.map((lead, idx) => (
                    <motion.tr 
                      key={lead.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="hover:bg-background/50 transition-colors group cursor-pointer"
                      onClick={(e) => {
                        if ((e.target as HTMLElement).tagName.toLowerCase() !== 'select') {
                          openDrawer(lead)
                        }
                      }}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                            {lead.name ? lead.name.charAt(0).toUpperCase() : "?"}
                          </div>
                          <div>
                            <p className="font-semibold">{lead.name || "Unknown"}</p>
                            <p className="text-xs text-textMuted group-hover:text-primary transition-colors">
                              Added {format(new Date(lead.created_at), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs">{lead.phone}</td>
                      <td className="px-6 py-4">
                        <select 
                          value={lead.status}
                          onChange={(e) => updateStatus(lead.id, e.target.value as LeadStatus)}
                          className={`appearance-none bg-transparent outline-none px-3 py-1.5 rounded-lg border text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors ${statusColors[lead.status] || statusColors.new}`}
                        >
                          <option value="new" className="text-black">NEW</option>
                          <option value="contacted" className="text-black">CONTACTED</option>
                          <option value="enrolled" className="text-black">ENROLLED</option>
                          <option value="lost" className="text-black">LOST</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <span className="capitalize px-2 py-1 bg-surface border border-border rounded-md text-xs">
                          {lead.source}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          className="px-3 py-1.5 text-xs font-medium text-textMuted border border-border rounded-lg bg-background hover:border-primary hover:text-primary transition-colors flex items-center gap-2 ml-auto"
                        >
                          View <ChevronRight size={14}/>
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
                {filteredLeads.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-textMuted">
                      No leads match your current search constraints.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="block md:hidden p-4 space-y-4">
             <AnimatePresence>
                {filteredLeads.map((lead) => (
                  <motion.div
                      key={`mob-${lead.id}`}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="bg-background border border-border p-4 rounded-xl flex flex-col gap-4"
                  >
                      <div className="flex justify-between items-start" onClick={() => openDrawer(lead)}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">
                            {lead.name ? lead.name.charAt(0).toUpperCase() : "?"}
                          </div>
                          <div>
                            <p className="font-bold text-textPrimary">{lead.name || "Unknown"}</p>
                            <p className="text-xs text-textMuted font-mono">{lead.phone}</p>
                          </div>
                        </div>
                        <button className="p-2 text-textMuted"><ChevronRight size={16}/></button>
                      </div>
                      <div className="flex justify-between items-center bg-surface p-2 rounded-lg border border-border">
                         <select 
                            value={lead.status}
                            onChange={(e) => updateStatus(lead.id, e.target.value as LeadStatus)}
                            className={`appearance-none bg-transparent outline-none px-2 py-1 rounded border text-[10px] font-bold uppercase tracking-widest cursor-pointer transition-colors ${statusColors[lead.status] || statusColors.new}`}
                          >
                            <option value="new" className="text-black">NEW</option>
                            <option value="contacted" className="text-black">CONTACTED</option>
                            <option value="enrolled" className="text-black">ENROLLED</option>
                            <option value="lost" className="text-black">LOST</option>
                         </select>
                         <span className="capitalize px-2 py-1 text-[10px] text-textMuted block">Source: {lead.source}</span>
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
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface border border-border rounded-card shadow-glow-primary/20 p-6 w-full max-w-md"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-textPrimary">Add Manual Lead</h2>
                <button onClick={() => setIsAddModalOpen(false)} className="text-textMuted hover:text-textPrimary"><X size={20}/></button>
              </div>
              <form onSubmit={handleAddLead} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-textMuted mb-2">Customer Name</label>
                  <input 
                    type="text" 
                    required
                    value={newLeadName}
                    onChange={(e) => setNewLeadName(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2 text-textPrimary focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-textMuted mb-2">Phone Number (with country code)</label>
                  <input 
                    type="text" 
                    required
                    value={newLeadPhone}
                    onChange={(e) => setNewLeadPhone(e.target.value)}
                    placeholder="+91..."
                    className="w-full bg-background border border-border rounded-xl px-4 py-2 text-textPrimary focus:outline-none focus:border-primary font-mono text-sm"
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={addingLead}
                  className="w-full py-2.5 bg-primary text-background font-bold rounded-xl mt-2 hover:bg-opacity-90 transition-all disabled:opacity-50"
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
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-surface border-l border-border z-50 flex flex-col shadow-2xl"
            >
              <div className="p-6 border-b border-border flex items-center justify-between bg-black/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
                    {selectedLead.name ? selectedLead.name.charAt(0).toUpperCase() : "?"}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-textPrimary">{selectedLead.name}</h3>
                    <p className="text-xs font-mono text-textMuted">{selectedLead.phone}</p>
                  </div>
                </div>
                <button onClick={() => setIsDrawerOpen(false)} className="p-2 hover:bg-white/5 rounded-full text-textMuted hover:text-textPrimary transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 bg-background">
                <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-textMuted mb-6 border-b border-border pb-2">
                  <MessageSquare size={14} /> Conversation History
                </h4>
                
                {drawerLoading ? (
                  <div className="text-center py-10 text-textMuted animate-pulse">Loading thread...</div>
                ) : drawerMessages.length === 0 ? (
                  <div className="text-center py-10 text-textMuted text-sm">
                    No WhatsApp history associated with this phone number.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {drawerMessages.map(msg => {
                      const isAI = msg.role === 'assistant';
                      return (
                        <div key={msg.id} className={`flex flex-col ${isAI ? 'items-end' : 'items-start'}`}>
                          <div className={`p-3 rounded-2xl max-w-[85%] text-sm ${isAI ? 'bg-primary/10 text-primary border border-primary/20 rounded-tr-sm' : 'bg-surface border border-border text-textPrimary rounded-tl-sm'}`}>
                            {msg.content}
                          </div>
                          <span className="text-[10px] text-textMuted mt-1 mx-1">{format(new Date(msg.sent_at), 'MMM d, h:mm a')}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {selectedLead.notes && (
                <div className="p-6 border-t border-border bg-black/20 shrink-0 max-h-48 overflow-y-auto">
                  <span className="text-xs font-bold text-textMuted uppercase mb-2 block">Captured Notes</span>
                  <div className="text-sm text-textPrimary whitespace-pre-wrap">
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
