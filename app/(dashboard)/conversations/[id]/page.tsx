"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { Conversation, Message, Lead } from "@/lib/types";
import { AlertCircle, CheckCircle, Info, Send, User, ChevronLeft, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastProvider";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";

const supabase = createClient();

export default function ConversationDetailPage({ params }: { params: { id: string } }) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [noteInput, setNoteInput] = useState("");
  const [sendingNote, setSendingNote] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [replyInput, setReplyInput] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { success, error } = useToast();

  const [showInfoPanel, setShowInfoPanel] = useState(false); // For mobile/tablet toggle

  useEffect(() => {
    async function fetchDetails() {
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

      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", params.id)
        .order("sent_at", { ascending: true });
        
      if (msgs) setMessages(msgs);

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

    const channel = supabase.channel(`msgs_${params.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${params.id}` },
        (payload) => {
          setMessages((prev) => {
            if (prev.some(m => m.id === payload.new.id)) return prev;
            return [...prev, payload.new as Message];
          });
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

  const sendManualReply = async () => {
    if (!replyInput.trim()) return;

    setSendingReply(true);
    try {
      const response = await fetch("/api/conversations/manual-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: params.id,
          message: replyInput,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Unable to send the reply");
      }

      const sentMessage: Message = {
        id: `manual_${Date.now()}`,
        conversation_id: params.id,
        role: "assistant",
        direction: "outbound",
        content: replyInput,
        sender_user_id: "current-user",
        sent_at: payload.sentAt || new Date().toISOString(),
      };

      setMessages((current) => [...current, sentMessage]);
      setConversation((current) =>
        current
          ? {
              ...current,
              last_message: replyInput,
              last_message_at: payload.sentAt || new Date().toISOString(),
              status: "active",
            }
          : current
      );
      setReplyInput("");
      setTimeout(() => scrollToBottom(), 100);
      success("Reply sent");
    } catch (sendError) {
      console.error(sendError);
      error(sendError instanceof Error ? sendError.message : "Failed to send reply");
    } finally {
      setSendingReply(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-surface border border-border rounded-xl">
        <Spinner size="lg" className="text-border" />
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="w-full h-full bg-surface border border-border rounded-xl">
        <EmptyState
          icon={MessageSquare}
          title="Conversation not found"
          description="This conversation may have been deleted or you don't have access to it."
          action={<Link href="/conversations" className="text-primary hover:underline font-medium">Return to Inbox</Link>}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full bg-[#08080c] overflow-hidden relative">
      
      {/* Middle Column: Chat Thread */}
      <div className="flex-1 flex flex-col h-full min-w-0 border-r border-border/40 relative">
        {/* Header */}
        <div className="px-6 border-b border-border bg-[#08080c] flex items-center justify-between shrink-0 h-16">
          <div className="flex items-center gap-3 w-full">
            <Link href="/conversations" className="xl:hidden p-1.5 -ml-1 text-textMuted hover:text-textPrimary rounded-md hover:bg-white/[0.04] transition-colors cursor-pointer block">
              <ChevronLeft size={16} />
            </Link>
            
            <div className="w-8 h-8 rounded-full bg-white/[0.02] border border-border flex items-center justify-center text-textMuted shrink-0">
              <User size={14} />
            </div>
            <div className="flex-grow min-w-0">
              <h3 className="font-semibold text-textPrimary text-xs truncate leading-tight">
                {conversation.customer_name || "Customer"}
              </h3>
              <p className="text-[10px] text-textMuted font-mono truncate">{conversation.customer_phone}</p>
            </div>
            
            <button 
              onClick={() => setShowInfoPanel(!showInfoPanel)}
              className="lg:hidden p-1.5 text-textMuted hover:text-textPrimary rounded-md hover:bg-white/[0.04] transition-colors"
            >
              <Info size={16} />
            </button>
          </div>
        </div>

        {/* Escalation Banner */}
        <AnimatePresence>
          {conversation.status === "escalated" && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-6 py-2 bg-red-500/10 border-b border-red-500/20 flex items-center gap-2 text-red-400 text-xs font-semibold shrink-0"
            >
              <AlertCircle size={12} />
              This conversation needs your attention
            </motion.div>
          )}
        </AnimatePresence>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {messages.length === 0 ? (
             <div className="text-center text-textMuted py-20 flex flex-col items-center justify-center">
              <MessageSquare className="w-8 h-8 mb-3 opacity-30 text-textMuted" />
              <p className="text-xs">This is the start of the conversation.</p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((msg) => {
                const isAI = msg.role === "assistant";
                const isManualReply = Boolean(msg.sender_user_id);
                return (
                  <motion.div
                    key={msg.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`flex flex-col ${isAI ? "items-end" : "items-start"}`}
                  >
                    <div 
                      className={`max-w-[80%] md:max-w-[70%] px-3.5 py-2 rounded-xl text-xs leading-relaxed ${
                        isAI 
                          ? "bg-white/[0.03] text-primary border border-primary/20 rounded-tr-none" 
                          : "bg-white/[0.01] text-textPrimary border border-border rounded-tl-none"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                    <span className="text-[9px] text-textMuted mt-1 mx-1.5 font-mono">
                      {format(new Date(msg.sent_at), "h:mm a")}{" "}
                      {isAI ? <span className="opacity-70">• {isManualReply ? "Team Reply" : "AI"}</span> : ""}
                    </span>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
          <div ref={bottomRef} className="h-2 w-full" />
        </div>

        {/* Reply Input Area */}
        <div className="p-4 border-t border-border bg-[#08080c] shrink-0">
          <div className="relative flex items-end gap-2 bg-white/[0.01] border border-border rounded-lg focus-within:border-border/80 transition-colors p-1">
             <textarea
                value={replyInput}
                onChange={(event) => setReplyInput(event.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendManualReply();
                  }
                }}
                placeholder="Type a manual reply... (Enter to send)"
                className="flex-grow bg-transparent resize-none outline-none text-xs text-textPrimary px-3 py-2 min-h-[38px] max-h-[120px] custom-scrollbar leading-normal"
                rows={1}
              />
              <button
                onClick={sendManualReply}
                disabled={sendingReply || !replyInput.trim()}
                className="shrink-0 w-8 h-8 m-0.5 rounded-md bg-primary text-background flex items-center justify-center hover:bg-primary/95 disabled:opacity-50 disabled:bg-transparent disabled:text-textMuted transition-colors"
              >
                {sendingReply ? <Spinner size="sm" /> : <Send size={12} />}
              </button>
          </div>
        </div>
      </div>

      {/* Right Column: Lead Info & Status Actions */}
      {/* Mobile backdrop overlay */}
      {showInfoPanel && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-10"
          onClick={() => setShowInfoPanel(false)}
        />
      )}
      <div className={cn(
        "absolute lg:static top-0 right-0 h-full w-full sm:w-[300px] bg-[#0c0c12] lg:bg-transparent shrink-0 z-20 flex flex-col transition-transform duration-300 transform border-l border-border/40",
        showInfoPanel ? "translate-x-0 shadow-2xl lg:shadow-none" : "translate-x-full lg:translate-x-0"
      )}>
        <div className="p-4 border-b border-border bg-[#0c0c12] lg:hidden flex items-center justify-between">
          <h3 className="text-xs font-bold text-textPrimary uppercase tracking-wider">Lead Information</h3>
          <button onClick={() => setShowInfoPanel(false)} className="text-textMuted p-1 text-xs">✕</button>
        </div>

        <div className="flex-grow overflow-y-auto p-5 space-y-6 custom-scrollbar">
          
          {/* Status Actions */}
          <div className="space-y-2">
             <h4 className="text-[10px] font-bold text-textMuted uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle size={12} className="text-primary"/> Resolution
            </h4>
            
            <button 
              onClick={() => updateStatus("resolved")}
              disabled={updatingStatus || conversation.status === "resolved"}
              className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-colors flex justify-center items-center gap-2 ${
                conversation.status === "resolved" 
                  ? "bg-white/[0.02] text-textMuted border border-border cursor-not-allowed"
                  : "bg-primary text-background hover:bg-primary/90"
              }`}
            >
              {updatingStatus && conversation.status !== "resolved" ? <Spinner size="sm" /> : "Mark as Resolved"}
            </button>
            
            <button 
              onClick={() => updateStatus("escalated")}
              disabled={updatingStatus || conversation.status === "escalated"}
              className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-colors flex justify-center items-center gap-2 ${
                conversation.status === "escalated" 
                  ? "bg-white/[0.02] text-textMuted border border-border cursor-not-allowed"
                  : "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
              }`}
            >
              {updatingStatus && conversation.status !== "escalated" ? <Spinner size="sm" /> : "Escalate to Owner"}
            </button>
          </div>

          <div className="h-px bg-border/40 w-full"></div>

          {/* Customer Profile */}
          <div className="space-y-4">
             <h4 className="text-[10px] font-bold text-textMuted uppercase tracking-wider flex items-center gap-1.5">
              <Info size={12} className="text-textMuted"/> Customer Profile
            </h4>
            
            <div>
              <span className="block text-[9px] text-textMuted mb-1 font-semibold uppercase tracking-wider">Phone Number</span>
              <span className="text-xs font-medium text-textPrimary font-mono">{conversation.customer_phone}</span>
            </div>
              
            {lead ? (
              <>
                <div>
                  <span className="block text-[9px] text-textMuted mb-1 font-semibold uppercase tracking-wider">Lead Status</span>
                  <span className="inline-block px-2 py-0.5 bg-white/[0.04] border border-border text-textPrimary text-[10px] rounded capitalize font-medium">
                    {lead.status}
                  </span>
                </div>
                <div>
                  <span className="block text-[9px] text-textMuted mb-1 font-semibold uppercase tracking-wider">Internal Notes</span>
                  <div className="text-[11px] text-textPrimary leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto custom-scrollbar">
                    {lead.notes || <span className="text-textMuted italic">No notes captured yet.</span>}
                  </div>
                </div>
              </>
            ) : (
              <div className="p-3 bg-white/[0.01] border border-border rounded-lg text-[11px] text-textMuted text-center">
                This contact is not currently in your lead pipeline.
              </div>
            )}
          </div>

          {/* Add Note Input */}
          <div className="pt-2">
            <span className="block text-[9px] text-textMuted mb-2 font-semibold uppercase tracking-wider">Add Note</span>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveNote()}
                placeholder="Type note..."
                className="flex-grow bg-white/[0.01] border border-border rounded-lg px-2.5 py-1.5 text-xs text-textPrimary focus:outline-none focus:border-border/80 transition-colors"
              />
              <button 
                onClick={saveNote}
                disabled={sendingNote || !noteInput.trim()}
                className="w-7 h-7 flex items-center justify-center shrink-0 bg-white/[0.04] border border-border hover:bg-white/[0.06] text-textPrimary rounded-lg disabled:opacity-50 transition-colors"
              >
                {sendingNote ? <Spinner size="sm"/> : <Send size={10} />}
              </button>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
