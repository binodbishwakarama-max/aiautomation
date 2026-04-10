"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { 
  Building2, 
  MessageCircle, 
  MessageSquare,
  HelpCircle,
  Copy,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  GripVertical,
  Link as LinkIcon
} from "lucide-react";
import { FAQ } from "@/lib/types";
import { useToast } from "@/components/ui/ToastProvider";

import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const supabase = createClient();

function SortableFaqItem({ faq, updateFaq, removeFaq }: { faq: FAQ, updateFaq: (id: string, field: string, value: string) => void, removeFaq: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: faq.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex gap-3 bg-background border border-border p-4 rounded-xl items-start">
      <div {...attributes} {...listeners} className="mt-2 text-textMuted hover:text-textPrimary cursor-grab">
        <GripVertical size={20} />
      </div>
      <div className="flex-1 space-y-3">
        <input 
          type="text" 
          placeholder="Question"
          value={faq.question}
          onChange={(e) => updateFaq(faq.id, 'question', e.target.value)}
          className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-textPrimary focus:border-primary focus:outline-none"
        />
        <textarea 
          placeholder="Answer"
          value={faq.answer}
          onChange={(e) => updateFaq(faq.id, 'answer', e.target.value)}
          className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-textPrimary focus:border-primary focus:outline-none min-h-[60px]"
        />
      </div>
      <button onClick={() => removeFaq(faq.id)} className="mt-2 text-textMuted hover:text-red-500 transition-colors">
        <Trash2 size={18} />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "success" | "error">("idle");
  const [businessId, setBusinessId] = useState("");

  // Business Profile
  const [name, setName] = useState("");
  const [businessType, setBusinessType] = useState("other");
  const [phoneNumber, setPhoneNumber] = useState("");

  // WhatsApp Setup
  const [whatsappNumberId, setWhatsappNumberId] = useState("");
  const [whatsappAccessToken, setWhatsappAccessToken] = useState("");
  const verifyToken = process.env.NEXT_PUBLIC_META_VERIFY_TOKEN || "replysync_secure_webhook_token_123";

  // Follow-up
  const [followUpEnabled, setFollowUpEnabled] = useState(true);
  const [followUpMessage, setFollowUpMessage] = useState("");

  // FAQs
  const [faqs, setFaqs] = useState<FAQ[]>([]);

  const { success, error } = useToast();
  const WebhookURL = typeof window !== 'undefined' ? `${window.location.origin}/api/webhook` : 'https://yourdomain.com/api/webhook';

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    async function fetchSettings() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      
      const { data: businessUsers } = await supabase
        .from("business_users")
        .select("business_id")
        .eq("user_id", userData.user.id);
        
      if (!businessUsers || businessUsers.length === 0) return;
      const bId = businessUsers[0].business_id;
      setBusinessId(bId);

      const { data: bData } = await supabase.from("businesses").select("*").eq("id", bId).single();
      if (bData) {
        setName(bData.name || "");
        setBusinessType(bData.business_type || "other");
        setPhoneNumber(bData.phone_number || "");
        setWhatsappNumberId(bData.whatsapp_number_id || "");
        setWhatsappAccessToken(bData.whatsapp_access_token || "");
        setFollowUpEnabled(bData.follow_up_enabled ?? true);
        setFollowUpMessage(bData.follow_up_message || "Hi! Just checking in — did you get all the information you needed? We'd love to help you get started. 😊");
      }

      const { data: faqsData } = await supabase.from("faqs").select("*").eq("business_id", bId).order('created_at', { ascending: true });
      if (faqsData) {
        setFaqs(faqsData);
      }

      setLoading(false);
    }
    fetchSettings();
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    success("Copied to clipboard");
  };

  const testConnection = async () => {
    if (!whatsappNumberId || !whatsappAccessToken) {
      error("Please enter Phone ID and Access Token first");
      return;
    }
    
    setTestingConnection(true);
    try {
      const res = await fetch("/api/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumberId: whatsappNumberId, accessToken: whatsappAccessToken })
      });
      const data = await res.json();
      
      if (data.success) {
        setConnectionStatus("success");
        success("WhatsApp API Connected Successfully!");
      } else {
        setConnectionStatus("error");
        error(data.error || "Connection failed");
      }
    } catch {
      setConnectionStatus("error");
      error("Network error testing connection");
    }
    setTestingConnection(false);
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      // 1. Update Profile & Settings
      const { error: bError } = await supabase.from("businesses").update({
        name,
        business_type: businessType,
        phone_number: phoneNumber,
        whatsapp_number_id: whatsappNumberId,
        whatsapp_access_token: whatsappAccessToken,
        follow_up_enabled: followUpEnabled,
        follow_up_message: followUpMessage
      }).eq("id", businessId);

      if (bError) throw bError;

      // 2. Sync FAQs (Simplest way: delete all existing and re-insert to preserve order/deletions)
      // DND mapping just relies on array order, but since we didn't add an explicit display_order column
      // deleting and re-inserting ensures chronological DB ordering matches the array order here.
      
      await supabase.from("faqs").delete().eq("business_id", businessId);
      
      if (faqs.length > 0) {
        const faqsToInsert = faqs.map(f => ({
          business_id: businessId,
          question: f.question,
          answer: f.answer,
        }));
        const { error: fError } = await supabase.from("faqs").insert(faqsToInsert);
        if (fError) throw fError;
      }

      success("Settings saved successfully!");
    } catch (err: unknown) {
      console.error(err);
      error("Failed to save settings");
    }
    setSavingSettings(false);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setFaqs((items) => {
        const oldIndex = items.findIndex(i => i.id === active.id);
        const newIndex = items.findIndex(i => i.id === over?.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const addFaq = () => {
    setFaqs([...faqs, { id: `new_${Date.now()}`, question: "", answer: "" } as FAQ]);
  };

  const updateFaq = (id: string, field: string, value: string) => {
    setFaqs(faqs.map(f => f.id === id ? { ...f, [field]: value } : f));
  };

  const removeFaq = (id: string) => {
    setFaqs(faqs.filter(f => f.id !== id));
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-8 max-w-4xl mx-auto pb-16 animate-pulse">
        <div className="flex justify-between items-center">
          <div><div className="h-8 w-48 bg-surface rounded-lg mb-2"></div><div className="h-4 w-80 bg-surface rounded-lg"></div></div>
          <div className="h-10 w-40 bg-surface rounded-xl"></div>
        </div>
        <div className="h-56 bg-surface rounded-card border border-border"></div>
        <div className="h-96 bg-surface rounded-card border border-border"></div>
        <div className="h-48 bg-surface rounded-card border border-border"></div>
        <div className="h-48 bg-surface rounded-card border border-border"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto pb-16">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-textPrimary mb-2">Configuration</h1>
          <p className="text-sm text-textMuted">Manage your business profile, WhatsApp integrations, and automation rules.</p>
        </div>
        <button 
          onClick={saveSettings}
          disabled={savingSettings}
          className="px-6 py-2.5 bg-primary text-background font-bold rounded-xl shadow-glow-primary hover:bg-opacity-90 disabled:opacity-50 transition-all"
        >
          {savingSettings ? "Saving..." : "Save All Changes"}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8">
        
        {/* 1. Business Profile */}
        <section className="bg-surface border border-border p-6 rounded-card">
          <h2 className="text-lg font-bold text-textPrimary flex items-center gap-2 mb-6">
            <Building2 size={18} className="text-primary" /> Business Profile
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-textMuted mb-2">Business Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-textPrimary focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-textMuted mb-2">Business Type</label>
              <select value={businessType} onChange={e => setBusinessType(e.target.value)} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-textPrimary focus:border-primary focus:outline-none appearance-none">
                <option value="coaching_institute">Coaching / Institute</option>
                <option value="consultancy">Consultancy</option>
                <option value="freelance">Freelancer</option>
                <option value="ecommerce">E-Commerce</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-textMuted mb-2">Public Contact Number</label>
              <input type="text" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} placeholder="+1 234 567 890" className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-textPrimary focus:border-primary focus:outline-none font-mono" />
            </div>
          </div>
        </section>

        {/* 2. WhatsApp Setup */}
        <section className="bg-surface border border-border p-6 rounded-card">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-lg font-bold text-textPrimary flex items-center gap-2 mb-1">
                <MessageCircle size={18} className="text-secondary" /> WhatsApp Meta Setup
              </h2>
              <p className="text-xs text-textMuted max-w-lg">Follow these explicit steps to connect your Meta Developer account and enable Webhook polling.</p>
            </div>
            {connectionStatus === "success" && <span className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold rounded-lg"><CheckCircle2 size={14}/> Connected</span>}
            {connectionStatus === "error" && <span className="flex items-center gap-1.5 px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold rounded-lg"><XCircle size={14}/> Connection Failed</span>}
          </div>

          <div className="space-y-6">
            <div className="flex gap-4 items-start">
              <div className="w-6 h-6 shrink-0 rounded-full bg-border text-textMuted flex items-center justify-center text-xs font-bold mt-1">1</div>
              <div>
                <p className="text-sm text-textPrimary font-medium mb-1">Create a Meta Developer App</p>
                <p className="text-xs text-textMuted">Head over to <a href="https://developers.facebook.com" target="_blank" className="text-primary hover:underline">developers.facebook.com</a>, create a &quot;Business&quot; app, and hook it internally.</p>
              </div>
            </div>
            
            <div className="flex gap-4 items-start">
              <div className="w-6 h-6 shrink-0 rounded-full bg-border text-textMuted flex items-center justify-center text-xs font-bold mt-1">2</div>
              <div>
                <p className="text-sm text-textPrimary font-medium mb-1">Add the WhatsApp Product</p>
                <p className="text-xs text-textMuted">In your app dashboard, scroll down and add &quot;WhatsApp&quot; to generate your API constraints.</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-6 h-6 shrink-0 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold md:mt-2">3</div>
              <div className="w-full">
                <p className="text-sm text-textPrimary font-medium mb-2">Paste your Phone Number ID</p>
                <input type="text" value={whatsappNumberId} onChange={e => setWhatsappNumberId(e.target.value)} placeholder="e.g. 1029384756..." className="w-full max-w-sm bg-background border border-border rounded-xl px-4 py-2 font-mono text-sm text-textPrimary focus:border-primary focus:outline-none" />
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-6 h-6 shrink-0 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold md:mt-2">4</div>
              <div className="w-full">
                <p className="text-sm text-textPrimary font-medium mb-2">Paste Temporary/Permanent Access Token</p>
                <input type="password" value={whatsappAccessToken} onChange={e => setWhatsappAccessToken(e.target.value)} placeholder="EAA..." className="w-full max-w-sm bg-background border border-border rounded-xl px-4 py-2 font-mono text-sm text-textPrimary focus:border-primary focus:outline-none" />
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-6 h-6 shrink-0 rounded-full bg-border text-textMuted flex items-center justify-center text-xs font-bold mt-1">5</div>
              <div className="w-full">
                <p className="text-sm text-textPrimary font-medium mb-2">Configure Webhook URL in Meta dashboard</p>
                <div className="flex items-center gap-2 max-w-sm">
                  <div className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-xs font-mono text-textMuted truncate">{WebhookURL}</div>
                  <button onClick={() => copyToClipboard(WebhookURL)} className="p-2 bg-surface border border-border rounded-lg text-textMuted hover:text-textPrimary hover:border-primary transition-colors"><Copy size={16}/></button>
                </div>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-6 h-6 shrink-0 rounded-full bg-border text-textMuted flex items-center justify-center text-xs font-bold mt-1">6</div>
              <div className="w-full">
                <p className="text-sm text-textPrimary font-medium mb-2">Set Auto-Generated Verify Token in Meta</p>
                <div className="flex items-center gap-2 max-w-sm">
                  <div className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-xs font-mono text-textMuted truncate">{verifyToken}</div>
                  <button onClick={() => copyToClipboard(verifyToken)} className="p-2 bg-surface border border-border rounded-lg text-textMuted hover:text-textPrimary hover:border-primary transition-colors"><Copy size={16}/></button>
                </div>
              </div>
            </div>

            <div className="pt-4 pl-10">
              <button 
                onClick={testConnection} 
                disabled={testingConnection}
                className="flex items-center gap-2 px-5 py-2.5 bg-background border border-border hover:border-primary hover:text-primary transition-colors rounded-xl text-sm font-bold text-textPrimary disabled:opacity-50"
              >
                <LinkIcon size={16} /> 
                {testingConnection ? "Testing Ping..." : "Test Connection"}
              </button>
            </div>
          </div>
        </section>

        {/* 3. FAQ Manager */}
        <section className="bg-surface border border-border p-6 rounded-card">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-textPrimary flex items-center gap-2">
              <HelpCircle size={18} className="text-primary" /> FAQ Knowledge Base
            </h2>
            <button onClick={addFaq} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-xs font-medium transition-colors">
              <Plus size={14} /> Add FAQ
            </button>
          </div>
          
          <div className="bg-background rounded-xl p-4 border border-border">
            {faqs.length === 0 ? (
              <p className="text-center text-sm text-textMuted py-4">No FAQs defined yet. Add some so the AI can automatically answer common questions.</p>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={faqs.map(f => f.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-3">
                    {faqs.map(faq => (
                      <SortableFaqItem key={faq.id} faq={faq} updateFaq={updateFaq} removeFaq={removeFaq} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </section>

        {/* 4. Follow-up Settings */}
        <section className="bg-surface border border-border p-6 rounded-card">
          <h2 className="text-lg font-bold text-textPrimary flex items-center gap-2 mb-6">
            <MessageSquare size={18} className="text-secondary" /> Automated Follow-ups
          </h2>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-background border border-border rounded-xl">
              <div>
                <p className="font-semibold text-sm text-textPrimary block mb-1">Enable 24-Hour Follow Up</p>
                <p className="text-xs text-textMuted">Automatically pings users backwards securely via Cron job if conversaton is left active.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={followUpEnabled} onChange={(e) => setFollowUpEnabled(e.target.checked)} className="sr-only peer" />
                <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary shadow-glow-primary/10"></div>
              </label>
            </div>

            <div className={`transition-all ${followUpEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
              <label className="block text-sm font-medium text-textMuted mb-2">Custom Message Layout</label>
              <textarea 
                value={followUpMessage}
                onChange={e => setFollowUpMessage(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-textPrimary focus:border-secondary focus:outline-none min-h-[100px]"
              />
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
