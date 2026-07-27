"use client";

import { useState } from "react";
import { MessageCircle, Send, Sparkles, RefreshCw, CheckCircle2, AlertTriangle, Play } from "lucide-react";
import type { FAQ } from "@/lib/types";

interface AiSimulatorWidgetProps {
  faqs: FAQ[];
  businessName?: string;
}

interface SimulatedMessage {
  id: string;
  sender: "customer" | "ai";
  text: string;
  matchedFaq?: string;
  escalated?: boolean;
  timestamp: string;
}

export default function AiSimulatorWidget({ faqs, businessName = "ReplySync AI Assistant" }: AiSimulatorWidgetProps) {
  const [inputMessage, setInputMessage] = useState("");
  const [isSimulating, setIsSimulating] = useState(false);
  const [messages, setMessages] = useState<SimulatedMessage[]>([
    {
      id: "1",
      sender: "ai",
      text: `Hello! Welcome to ${businessName}. How can I assist you today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = inputMessage.trim();
    if (!query || isSimulating) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const customerMsg: SimulatedMessage = {
      id: `msg_${Date.now()}`,
      sender: "customer",
      text: query,
      timestamp: timeStr,
    };

    setMessages((prev) => [...prev, customerMsg]);
    setInputMessage("");
    setIsSimulating(true);

    // Simulate AI response matching logic
    setTimeout(() => {
      const lowerQuery = query.toLowerCase();
      
      // Match against configured FAQs
      const matched = faqs.find(
        (f) =>
          lowerQuery.includes(f.question.toLowerCase()) ||
          f.question.toLowerCase().includes(lowerQuery) ||
          f.answer.toLowerCase().includes(lowerQuery)
      );

      let aiReplyText = "";
      let matchedFaqTitle: string | undefined = undefined;
      let isEscalated = false;

      if (matched && matched.answer.trim()) {
        aiReplyText = matched.answer;
        matchedFaqTitle = matched.question;
      } else if (lowerQuery.includes("fee") || lowerQuery.includes("price") || lowerQuery.includes("cost")) {
        const feeFaq = faqs.find((f) => f.question.toLowerCase().includes("fee") || f.question.toLowerCase().includes("price"));
        if (feeFaq) {
          aiReplyText = feeFaq.answer;
          matchedFaqTitle = feeFaq.question;
        } else {
          aiReplyText = "Our pricing varies based on the course program. Please let us know which program you are interested in!";
        }
      } else if (lowerQuery.includes("human") || lowerQuery.includes("talk to agent") || lowerQuery.includes("call")) {
        aiReplyText = "I have notified our team. A human representative will reach out to you shortly!";
        isEscalated = true;
      } else {
        // General fallback
        aiReplyText = `Thank you for your inquiry about "${query}". Our team has recorded your request and will follow up with complete details!`;
      }

      const aiMsg: SimulatedMessage = {
        id: `ai_${Date.now()}`,
        sender: "ai",
        text: aiReplyText,
        matchedFaq: matchedFaqTitle,
        escalated: isEscalated,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsSimulating(false);
    }, 700);
  };

  const handleReset = () => {
    setMessages([
      {
        id: "1",
        sender: "ai",
        text: `Hello! Welcome to ${businessName}. How can I assist you today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  const quickQuestions = faqs.slice(0, 3).map((f) => f.question).filter(Boolean);

  return (
    <div className="glass-card rounded-2xl border border-white/10 overflow-hidden flex flex-col shadow-2xl">
      {/* Widget Header */}
      <div className="p-4 bg-surface border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <MessageCircle size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-textPrimary font-sans">Interactive AI WhatsApp Simulator</h3>
              <span className="px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-accent font-mono text-[9px] font-bold uppercase">
                Live Sandbox
              </span>
            </div>
            <p className="text-[10px] text-textMuted mt-0.5">
              Test how your AI WhatsApp Assistant responds to customer inquiries in real time.
            </p>
          </div>
        </div>

        <button
          onClick={handleReset}
          className="p-2 text-textMuted hover:text-textPrimary hover:bg-surface border border-border rounded-xl transition-colors text-xs flex items-center gap-1.5 min-h-[36px]"
          title="Reset conversation"
        >
          <RefreshCw size={13} />
          <span className="hidden sm:inline text-[11px] font-mono">Reset</span>
        </button>
      </div>

      {/* Chat Messages Body */}
      <div className="p-4 bg-[#090a0f] min-h-[260px] max-h-[340px] overflow-y-auto space-y-3 custom-scrollbar flex flex-col justify-end">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === "customer" ? "items-end" : "items-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs font-sans leading-relaxed shadow-sm ${
                msg.sender === "customer"
                  ? "bg-accent text-background font-semibold rounded-br-none"
                  : "bg-surface border border-border text-textPrimary rounded-bl-none"
              }`}
            >
              <p>{msg.text}</p>
              
              {/* Matched FAQ indicator */}
              {msg.matchedFaq && (
                <div className="mt-2 pt-1.5 border-t border-white/10 flex items-center gap-1.5 text-[9px] font-mono text-emerald-400 font-medium">
                  <CheckCircle2 size={11} className="shrink-0" />
                  <span>Matched FAQ: &quot;{msg.matchedFaq}&quot;</span>
                </div>
              )}

              {/* Escalation indicator */}
              {msg.escalated && (
                <div className="mt-2 pt-1.5 border-t border-white/10 flex items-center gap-1.5 text-[9px] font-mono text-amber-400 font-medium">
                  <AlertTriangle size={11} className="shrink-0" />
                  <span>Human Escalation Triggered</span>
                </div>
              )}
            </div>
            
            <span className="text-[9px] font-mono text-textMuted mt-1 px-1">{msg.timestamp}</span>
          </div>
        ))}

        {isSimulating && (
          <div className="flex items-center gap-2 text-xs text-textMuted font-mono animate-pulse p-2">
            <Sparkles size={13} className="text-accent animate-spin" />
            <span>AI Assistant is generating response...</span>
          </div>
        )}
      </div>

      {/* Suggested Prompts */}
      {quickQuestions.length > 0 && (
        <div className="p-2.5 bg-surface/50 border-t border-border flex items-center gap-2 overflow-x-auto custom-scrollbar">
          <span className="text-[10px] font-mono text-textMuted uppercase font-bold shrink-0">Try Asking:</span>
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => {
                setInputMessage(q);
              }}
              className="text-[10px] font-mono bg-surface hover:bg-surface/80 border border-border text-textPrimary px-2.5 py-1 rounded-lg shrink-0 whitespace-nowrap transition-colors flex items-center gap-1"
            >
              <Play size={8} className="text-accent" />
              <span>{q}</span>
            </button>
          ))}
        </div>
      )}

      {/* Input Bar */}
      <form onSubmit={handleSendMessage} className="p-3 bg-surface border-t border-border flex items-center gap-2">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type a customer question (e.g. What are your fees?)..."
          className="flex-1 bg-background border border-border rounded-xl px-3.5 py-2 text-xs text-textPrimary focus:outline-none focus:border-accent/40 font-sans"
        />
        <button
          type="submit"
          disabled={!inputMessage.trim() || isSimulating}
          className="btn-primary p-2.5 rounded-xl shrink-0 disabled:opacity-40 min-h-[38px] flex items-center justify-center"
          title="Send test message"
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}
