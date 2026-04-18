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
    <div className="flex h-full w-full bg-surface border border-border rounded-xl overflow-hidden relative">
      
      {/* Middle Column: Chat Thread (50% overall width on desktop) */}
      <div className="flex-1 flex flex-col h-full min-w-0 border-r border-border relative">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border bg-background/50 backdrop-blur-sm z-10 flex items-center justify-between shrink-0 h-16">
          <div className="flex items-center gap-3 w-full">
            <Link href="/conversations" className="xl:hidden p-2 -ml-2 mr-1 text-textMuted hover:text-textPrimary rounded-lg hover:bg-surface transition-colors cursor-pointer block">
              <ChevronLeft size={20} />
            </Link>
            
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
              <User size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-textPrimary text-sm truncate leading-tight">
                {conversation.customer_name || "Customer"}
              </h3>
              <p className="text-xs text-textMuted font-mono truncate">{conversation.customer_phone}</p>
            </div>
            
            <button 
              onClick={() => setShowInfoPanel(!showInfoPanel)}
              className="lg:hidden p-2 text-textMuted hover:text-secondary rounded-lg hover:bg-secondary/10 transition-colors"
            >
              <Info size={20} />
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
              className="px-4 py-2 bg-red-500/10 border-b border-red-500/30 flex items-center gap-2 text-red-500 text-xs font-semibold shrink-0"
            >
              <AlertCircle size={14} />
              This conversation needs your attention
            </motion.div>
          )}
        </AnimatePresence>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4 custom-scrollbar">
          {messages.length === 0 ? (
             <div className="text-center text-textMuted py-20 flex flex-col items-center justify-center">
              <MessageSquare className="w-10 h-10 mb-4 opacity-30" />
              <p className="text-sm">This is the start of the conversation.</p>
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
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={`flex flex-col ${isAI ? "items-end" : "items-start"}`}
                  >
                    <div 
                      className={`max-w-[85%] md:max-w-[75%] px-4 py-2.5 rounded-2xl ${
                        isAI 
                          ? "bg-primary/10 text-primary border border-primary/20 rounded-tr-sm" 
                          : "bg-[#1E1E2E] text-textPrimary border border-border rounded-tl-sm"
                      }`}
                    >
                      <p className="whitespace-pre-wrap text-[14px] leading-[1.4] tracking-tight">{msg.content}</p>
                    </div>
                    <span className="text-[10px] text-textMuted mt-1 mx-1.5 font-medium">
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
        <div className="p-4 border-t border-border bg-background shrink-0">
          <div className="relative flex items-end gap-2 bg-surface border border-border rounded-xl focus-within:border-secondary focus-within:shadow-glow-secondary/20 transition-all p-1">
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
                className="flex-1 bg-transparent resize-none outline-none text-sm text-textPrimary px-3 py-2.5 min-h-[44px] max-h-[150px] custom-scrollbar leading-relaxed"
                rows={1}
              />
              <button
                onClick={sendManualReply}
                disabled={sendingReply || !replyInput.trim()}
                className="shrink-0 w-10 h-10 m-0.5 rounded-lg bg-secondary text-white flex items-center justify-center hover:bg-secondary/90 disabled:opacity-50 disabled:bg-surface disabled:text-textMuted transition-all"
              >
                {sendingReply ? <Spinner size="sm" /> : <Send size={16} className="-ml-0.5 mt-0.5" />}
              </button>
          </div>
        </div>
      </div>

      {/* Right Column: Lead Info & Status Actions (25% overall width on desktop) */}
      <div className={cn(
        "absolute lg:static top-0 right-0 h-full w-[320px] bg-background lg:bg-surface shrink-0 z-20 flex flex-col transition-transform duration-300 transform",
        showInfoPanel ? "translate-x-0" : "translate-x-full lg:translate-x-0 shadow-2xl lg:shadow-none"
      )}>
        <div className="p-4 border-b border-border bg-background/50 backdrop-blur-sm lg:hidden flex items-center justify-between">
          <h3 className="font-bold text-textPrimary">Lead Information</h3>
          <button onClick={() => setShowInfoPanel(false)} className="text-textMuted p-1">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
          
          {/* Status Actions */}
          <div className="space-y-3">
             <h4 className="text-xs font-bold text-textMuted uppercase tracking-wider flex items-center gap-2">
              <CheckCircle size={14} className="text-primary"/> Resolution
            </h4>
            
            <button 
              onClick={() => updateStatus("resolved")}
              disabled={updatingStatus || conversation.status === "resolved"}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex justify-center items-center gap-2 ${
                conversation.status === "resolved" 
                  ? "bg-gray-500/10 text-gray-500 border border-gray-500/20 cursor-not-allowed"
                  : "bg-primary text-background hover:opacity-90 shadow-glow-primary"
              }`}
            >
              {updatingStatus && conversation.status !== "resolved" ? <Spinner size="sm" /> : "Mark as Resolved"}
            </button>
            
            <button 
              onClick={() => updateStatus("escalated")}
              disabled={updatingStatus || conversation.status === "escalated"}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex justify-center items-center gap-2 ${
                conversation.status === "escalated" 
                  ? "bg-gray-500/10 text-gray-500 border border-gray-500/20 cursor-not-allowed"
                  : "bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20"
              }`}
            >
              {updatingStatus && conversation.status !== "escalated" ? <Spinner size="sm" /> : "Escalate to Owner"}
            </button>
          </div>

          <div className="h-px bg-border w-full"></div>

          {/* Customer Profile */}
          <div className="space-y-4">
             <h4 className="text-xs font-bold text-textMuted uppercase tracking-wider flex items-center gap-2">
              <Info size={14} className="text-secondary"/> Customer Profile
            </h4>
            
            <div>
              <span className="block text-[10px] text-textMuted mb-1 font-semibold uppercase tracking-wider">Phone Number</span>
              <span className="text-sm font-medium text-textPrimary font-mono">{conversation.customer_phone}</span>
            </div>
              
            {lead ? (
              <>
                <div>
                  <span className="block text-[10px] text-textMuted mb-1 font-semibold uppercase tracking-wider">Lead Status</span>
                  <span className="inline-block px-2 py-0.5 bg-secondary/10 text-secondary text-xs rounded border border-secondary/20 capitalize font-medium">
                    {lead.status}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-textMuted mb-1 font-semibold uppercase tracking-wider">Internal Notes</span>
                  <div className="text-xs text-textPrimary leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto custom-scrollbar">
                    {lead.notes || <span className="text-textMuted italic">No notes captured yet.</span>}
                  </div>
                </div>
              </>
            ) : (
              <div className="p-3 bg-surface border border-border/50 rounded-lg text-xs text-textMuted text-center">
                This contact is not currently in your lead pipeline.
              </div>
            )}
          </div>

          {/* Add Note Input */}
          <div className="pt-2">
            <span className="block text-[10px] text-textMuted mb-2 font-semibold uppercase tracking-wider">Add Note</span>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveNote()}
                placeholder="Type note..."
                className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-xs text-textPrimary focus:outline-none focus:border-secondary transition-colors"
              />
              <button 
                onClick={saveNote}
                disabled={sendingNote || !noteInput.trim()}
                className="w-8 h-8 flex items-center justify-center shrink-0 bg-secondary/10 text-secondary rounded-lg hover:bg-secondary/20 disabled:opacity-50 transition-colors"
              >
                {sendingNote ? <Spinner size="sm"/> : <Send size={14} />}
              </button>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
