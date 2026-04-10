"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Conversation, Message, Lead } from "@/lib/types";
import { AlertCircle, CheckCircle, Info, Send, User, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const supabase = createClient();

export default function ConversationDetailPage({ params }: { params: { id: string } }) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [noteInput, setNoteInput] = useState("");
  const [sendingNote, setSendingNote] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const router = useRouter();



  useEffect(() => {
    async function fetchDetails() {
      // 1. Fetch Conversation
      const { data: conv } = await supabase
        .from("conversations")
        .select("*")
        .eq("id", params.id)
        .single();
        
      if (!conv) {
        setLoading(false);
        return;
      }
      setConversation(conv);

      // 2. Fetch Messages
      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", params.id)
        .order("sent_at", { ascending: true });
        
      if (msgs) setMessages(msgs);

      // 3. Fetch Lead if exists
      const { data: ld } = await supabase
        .from("leads")
        .select("*")
        .eq("business_id", conv.business_id)
        .eq("phone", conv.customer_phone)
        .single();
      
      if (ld) setLead(ld);
      
      setLoading(false);
      setTimeout(() => scrollToBottom(), 100);
    }
    
    fetchDetails();

    // 4. Real-time Subscription for Messages
    const channel = supabase.channel(`msgs_${params.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${params.id}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
          setTimeout(() => scrollToBottom(), 100);
        }
      ).subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [params.id]);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const updateStatus = async (newStatus: string) => {
    setUpdatingStatus(true);
    await supabase.from("conversations").update({ status: newStatus }).eq("id", params.id);
    setConversation((prev: Conversation | null) => prev ? ({ ...prev, status: newStatus as "active" | "followed_up" | "resolved" | "escalated" }) : null);
    setUpdatingStatus(false);
    router.refresh();
  };

  const saveNote = async () => {
    if (!noteInput.trim()) return;
    setSendingNote(true);
    
    if (lead) {
      const updatedNotes = lead.notes ? `${lead.notes}\n- ${noteInput}` : `- ${noteInput}`;
      await supabase.from("leads").update({ notes: updatedNotes }).eq("id", lead.id);
      setLead({ ...lead, notes: updatedNotes });
    } else if (conversation) {
      // Create a lead automatically if they add a note
      const { data: newLead } = await supabase.from("leads").insert({
        business_id: conversation.business_id,
        name: conversation.customer_name || 'Unknown',
        phone: conversation.customer_phone,
        status: 'new' as const,
        notes: `- ${noteInput}`
      }).select().single();
      
      if (newLead) setLead(newLead as Lead);
    }
    
    setNoteInput("");
    setSendingNote(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full max-w-7xl mx-auto animate-pulse gap-6">
        <div className="h-5 w-48 bg-surface rounded-lg"></div>
        <div className="flex flex-col lg:flex-row gap-6 flex-1">
          <div className="flex-1 bg-surface rounded-card border border-border flex flex-col">
            <div className="p-4 border-b border-border flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-border"></div>
              <div className="space-y-2"><div className="h-4 w-32 bg-border rounded"></div><div className="h-3 w-24 bg-border rounded"></div></div>
            </div>
            <div className="flex-1 p-6 space-y-6">
              {[1,2,3,4].map(i => <div key={i} className={`flex ${i%2===0?'justify-end':''}`}><div className="h-16 w-3/5 bg-border rounded-2xl"></div></div>)}
            </div>
          </div>
          <div className="w-full lg:w-[320px] space-y-6">
            <div className="h-40 bg-surface rounded-card border border-border"></div>
            <div className="h-64 bg-surface rounded-card border border-border"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!conversation) {
    return <div className="h-full w-full flex flex-col items-center justify-center text-textMuted">
      <h2 className="text-xl font-bold text-textPrimary">Conversation not found</h2>
      <Link href="/conversations" className="text-primary mt-4 hover:underline">Go back</Link>
    </div>;
  }

  return (
    <div className="flex flex-col h-full max-w-7xl mx-auto -mt-4">
      <Link href="/conversations" className="inline-flex items-center gap-2 text-sm text-textMuted hover:text-primary mb-4 transition-colors w-fit">
        <ChevronLeft size={16} /> Back to Conversations
      </Link>

      {conversation.status === "escalated" && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl flex items-center gap-3 text-red-500">
          <AlertCircle size={20} />
          <span className="font-semibold">This conversation needs your attention</span>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-200px)]">
        
        {/* Left Panel: Chat Thread */}
        <div className="flex-1 bg-surface border border-border rounded-card flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border bg-background/50 backdrop-blur-sm z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                <User size={20} />
              </div>
              <div>
                <h3 className="font-bold text-textPrimary">{conversation.customer_name || "Customer"}</h3>
                <p className="text-xs text-textMuted">{conversation.customer_phone}</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.length === 0 ? (
              <div className="text-center text-textMuted py-10">No messages yet.</div>
            ) : (
              messages.map((msg) => {
                const isAI = msg.role === "assistant";
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex flex-col ${isAI ? "items-end" : "items-start"}`}
                  >
                    <div 
                      className={`max-w-[80%] md:max-w-[70%] p-4 rounded-2xl ${
                        isAI 
                          ? "bg-primary/10 text-primary border border-primary/20 rounded-tr-sm shadow-glow-primary/5" 
                          : "bg-border text-textPrimary rounded-tl-sm"
                      }`}
                    >
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                    </div>
                    <span className="text-[10px] text-textMuted mt-1 mx-1">
                      {format(new Date(msg.sent_at), "h:mm a")} {isAI ? "• AI Assistant" : ""}
                    </span>
                  </motion.div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Right Panel: Customer Info & Actions */}
        <div className="w-full lg:w-[320px] flex flex-col gap-6 shrink-0 overflow-y-auto">
          {/* Action Card */}
          <div className="bg-surface border border-border p-5 rounded-card flex flex-col gap-4">
            <h3 className="font-bold text-textPrimary flex items-center gap-2">
              <CheckCircle size={18} className="text-primary"/> Status Actions
            </h3>
            
            <button 
              onClick={() => updateStatus("resolved")}
              disabled={updatingStatus || conversation.status === "resolved"}
              className={`w-full py-2.5 px-4 rounded-xl text-sm font-semibold transition-all ${
                conversation.status === "resolved" 
                  ? "bg-gray-500/10 text-gray-400 border border-gray-500/20 cursor-not-allowed"
                  : "bg-primary text-background hover:bg-opacity-90 shadow-glow-primary"
              }`}
            >
              Mark as Resolved
            </button>
            
            <button 
              onClick={() => updateStatus("escalated")}
              disabled={updatingStatus || conversation.status === "escalated"}
              className={`w-full py-2.5 px-4 rounded-xl text-sm font-semibold transition-all ${
                conversation.status === "escalated" 
                  ? "bg-gray-500/10 text-gray-400 border border-gray-500/20 cursor-not-allowed"
                  : "bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20"
              }`}
            >
              Escalate to Owner
            </button>
          </div>

          {/* Customer Info Card */}
          <div className="bg-surface border border-border p-5 rounded-card flex flex-col gap-4">
            <h3 className="font-bold text-textPrimary flex items-center gap-2 mb-2">
              <Info size={18} className="text-secondary"/> Lead Intelligence
            </h3>

            <div className="space-y-4">
              <div>
                <span className="block text-xs text-textMuted mb-1">Phone Number</span>
                <span className="text-sm font-medium text-textPrimary">{conversation.customer_phone}</span>
              </div>
              
              {lead ? (
                <>
                  <div>
                    <span className="block text-xs text-textMuted mb-1">Lead Status</span>
                    <span className="inline-block px-2 py-1 bg-secondary/10 text-secondary text-xs rounded-lg border border-secondary/20 capitalize">
                      {lead.status}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs text-textMuted mb-1">Captured Notes</span>
                    <div className="text-sm text-textPrimary bg-background p-3 rounded-xl border border-border whitespace-pre-wrap max-h-32 overflow-y-auto">
                      {lead.notes || "No notes captured yet."}
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-3 bg-background border border-border rounded-xl text-sm text-textMuted text-center">
                  This contact is not currently in your lead pipeline.
                </div>
              )}

              <div className="pt-2 border-t border-border">
                <span className="block text-xs text-textMuted mb-2">Add Internal Note</span>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && saveNote()}
                    placeholder="E.g., Interested in morning batch..."
                    className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-textPrimary focus:outline-none focus:border-secondary transition-colors"
                  />
                  <button 
                    onClick={saveNote}
                    disabled={sendingNote || !noteInput.trim()}
                    className="p-2 bg-secondary/10 text-secondary rounded-lg hover:bg-secondary/20 disabled:opacity-50 transition-colors"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
