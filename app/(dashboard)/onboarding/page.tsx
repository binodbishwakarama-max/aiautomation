"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { 
  Building2, 
  HelpCircle, 
  MessageCircle, 
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Copy,
  Plus,
  Trash2,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";
import Confetti from "react-confetti";

const SUGGESTED_FAQS = [
  { id: "1", question: "What courses do you offer?", answer: "" },
  { id: "2", question: "What are your batch timings?", answer: "" },
  { id: "3", question: "What is the fee structure?", answer: "" },
  { id: "4", question: "How do I enroll?", answer: "" },
  { id: "5", question: "Do you offer trial classes?", answer: "" }
];

const supabase = createClient();

export default function OnboardingPage() {
  const { activeWorkspaceId, loading: workspaceLoading, canManageWorkspace } = useWorkspace();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [windowDimensions, setWindowDimensions] = useState({ width: 0, height: 0 });
  const [showConfetti, setShowConfetti] = useState(false);
  const router = useRouter();


  // Step 1 State
  const [name, setName] = useState("");
  const [type, setType] = useState("coaching_institute");
  const [city, setCity] = useState("");

  // Step 2 State
  const [faqs, setFaqs] = useState<{ id: string, question: string, answer: string }[]>([...SUGGESTED_FAQS]);

  // Step 3 State
  const [phoneId, setPhoneId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [appSecret, setAppSecret] = useState("");
  const [testing, setTesting] = useState(false);
  const [testError, setTestError] = useState("");

  const { success, error } = useToast();

  const WebhookURL = typeof window !== 'undefined' ? `${window.location.origin}/api/webhook` : 'https://yourdomain.com/api/webhook';
  const verifyToken = process.env.NEXT_PUBLIC_META_VERIFY_TOKEN || "replysync_secure_webhook_token_123";

  useEffect(() => {
    setWindowDimensions({ width: window.innerWidth, height: window.innerHeight });
    
    async function init() {
      if (!activeWorkspaceId) {
        setLoading(false);
        return;
      }

      const { data: bData } = await supabase
        .from("businesses")
        .select("id, name, business_type, city, whatsapp_number_id")
        .eq("id", activeWorkspaceId)
        .single();
      if (bData) {
        setName(bData.name || "");
        if (bData.business_type) setType(bData.business_type);
        if (bData.city) setCity(bData.city);
        if (bData.whatsapp_number_id) setPhoneId(bData.whatsapp_number_id);
      }
      setLoading(false);
    }
    if (!workspaceLoading) {
      void init();
    }
  }, [activeWorkspaceId, workspaceLoading]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    success("Copied to clipboard");
  };

  const handleStep1Next = async () => {
    if (!activeWorkspaceId) return error("No workspace selected");
    if (!name.trim()) return error("Business name is required");
    await supabase.from("businesses").update({ name, business_type: type, city }).eq("id", activeWorkspaceId);
    setStep(2);
  };

  const handleStep2Next = async () => {
    if (!activeWorkspaceId) return error("No workspace selected");
    // Filter out empty answers
    const filledFaqs = faqs.filter(f => f.question.trim() && f.answer.trim());
    
    if (filledFaqs.length > 0) {
      await supabase.from("faqs").delete().eq("business_id", activeWorkspaceId); // Clean flush
      await supabase.from("faqs").insert(
        filledFaqs.map((faq, index) => ({
          business_id: activeWorkspaceId,
          question: faq.question,
          answer: faq.answer,
          display_order: index,
        }))
      );
    }
    setStep(3);
  };

  const handleTestConnection = async () => {
    if (!activeWorkspaceId) return error("No workspace selected.");
    if (!phoneId || !accessToken || !appSecret) {
      return error("Please enter Phone Number ID, Access Token, and App Secret.");
    }
    
    setTesting(true);
    setTestError("");
    
    try {
      const res = await fetch("/api/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: activeWorkspaceId,
          phoneNumberId: phoneId,
          accessToken
        })
      });
      const data = await res.json();
      
      if (data.success) {
        const saveResponse = await fetch("/api/workspace/whatsapp-config", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workspaceId: activeWorkspaceId,
            whatsappNumberId: phoneId,
            accessToken,
            appSecret,
            followUpEnabled: false,
            followUpTemplateName: null,
            followUpTemplateLanguageCode: "en_US",
            followUpTemplateVariables: [],
          }),
        });

        const savePayload = await saveResponse.json();
        if (!saveResponse.ok) {
          setTestError(savePayload.error || "Unable to store WhatsApp credentials.");
          setTesting(false);
          return;
        }

        setShowConfetti(true);
        success("WhatsApp API Connected! Redirecting...");
        setTimeout(() => {
          router.push("/dashboard");
        }, 3500);
      } else {
        setTestError(data.error || "Invalid credentials.");
      }
    } catch {
      setTestError("Network error. Could not connect to Meta.");
    }
    setTesting(false);
  };

  if (loading || workspaceLoading) return <div className="h-screen flex items-center justify-center">Loading...</div>;

  if (!canManageWorkspace) {
    return <div className="h-screen flex items-center justify-center text-textMuted">Only workspace admins can complete onboarding.</div>;
  }

  const pageVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)] px-4 pb-12">
      {showConfetti && <Confetti width={windowDimensions.width} height={windowDimensions.height} recycle={false} numberOfPieces={500} gravity={0.15}/>}
      
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-textPrimary mb-2">Welcome to ReplySync</h1>
          <p className="text-textMuted text-sm">Let&apos;s get your AI Assistant ready to work.</p>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center justify-between relative mb-12">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-border rounded-full -z-10"></div>
          <motion.div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary rounded-full -z-10"
            initial={{ width: "0%" }}
            animate={{ width: `${(step - 1) * 50}%` }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          ></motion.div>

          {[
            { num: 1, icon: Building2, label: "Profile" },
            { num: 2, icon: HelpCircle, label: "Knowledge" },
            { num: 3, icon: MessageCircle, label: "WhatsApp" }
          ].map(s => (
            <div key={s.num} className="flex flex-col items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                step >= s.num 
                  ? "bg-primary text-background shadow-[0_0_15px_rgba(110,231,183,0.4)]" 
                  : "bg-surface border-2 border-border text-textMuted"
              }`}>
                <s.icon size={18} className={step >= s.num ? "text-background" : ""} />
              </div>
              <span className={`text-xs font-bold uppercase tracking-wider ${step >= s.num ? "text-primary" : "text-textMuted"}`}>{s.label}</span>
            </div>
          ))}
        </div>

        <div className="bg-surface border border-border p-8 md:p-10 rounded-[28px] shadow-2xl relative overflow-hidden">
          <AnimatePresence mode="wait">
            
            {/* STEP 1: Profile */}
            {step === 1 && (
              <motion.div key="step1" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }} className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-textPrimary mb-1">Business Details</h2>
                  <p className="text-sm text-textMuted">This identifies your workspace locally internally.</p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-textMuted mb-2">Business Name</label>
                    <input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="Acme Academy" className="w-full bg-background border border-border rounded-xl px-4 py-3 text-textPrimary focus:border-primary focus:outline-none transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-textMuted mb-2">Business Category</label>
                    <select value={type} onChange={e=>setType(e.target.value)} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-textPrimary focus:border-primary focus:outline-none appearance-none transition-colors cursor-pointer">
                      <option value="coaching_institute">Coaching Institute</option>
                      <option value="tuition_center">Tuition Center</option>
                      <option value="e_learning">E-Learning</option>
                      <option value="consultancy">Consultancy</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-textMuted mb-2">City</label>
                    <input type="text" value={city} onChange={e=>setCity(e.target.value)} placeholder="E.g., Bangalore, London" className="w-full bg-background border border-border rounded-xl px-4 py-3 text-textPrimary focus:border-primary focus:outline-none transition-colors" />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button onClick={handleStep1Next} className="flex items-center gap-2 px-6 py-3 bg-primary text-background font-bold rounded-xl hover:bg-opacity-90 transition-all shadow-glow-primary">
                    Next Step <ArrowRight size={18} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: FAQs */}
            {step === 2 && (
              <motion.div key="step2" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }} className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-textPrimary mb-1">Add Your FAQs</h2>
                  <p className="text-sm text-textMuted">These are the questions your AI will answer automatically. You can edit these later.</p>
                </div>

                <div className="max-h-[350px] overflow-y-auto pr-2 space-y-4">
                  {faqs.map(faq => (
                    <div key={faq.id} className="bg-background border border-border p-4 rounded-xl flex gap-3">
                      <div className="flex-1 space-y-3">
                        <input type="text" value={faq.question} onChange={e => setFaqs(faqs.map(f => f.id === faq.id ? { ...f, question: e.target.value } : f))} placeholder="Question..." className="w-full bg-transparent font-medium text-textPrimary focus:outline-none" />
                        <textarea value={faq.answer} onChange={e => setFaqs(faqs.map(f => f.id === faq.id ? { ...f, answer: e.target.value } : f))} placeholder="Answer..." className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-textPrimary focus:border-primary focus:outline-none min-h-[40px]" />
                      </div>
                      <button onClick={() => setFaqs(faqs.filter(f => f.id !== faq.id))} className="text-textMuted hover:text-red-500 mt-1 h-fit"><Trash2 size={18}/></button>
                    </div>
                  ))}

                  <button onClick={() => setFaqs([...faqs, { id: `new_${Date.now()}`, question: "", answer: "" }])} className="w-full py-3 border border-dashed border-border rounded-xl text-textMuted hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2 text-sm font-medium">
                    <Plus size={16} /> Add Custom FAQ
                  </button>
                </div>

                <div className="pt-4 flex justify-between items-center bg-surface w-full z-10">
                  <button onClick={() => setStep(1)} className="flex items-center gap-2 px-4 py-2 text-textMuted hover:text-textPrimary transition-colors font-medium">
                    <ArrowLeft size={16} /> Back
                  </button>
                  <button onClick={handleStep2Next} className="flex items-center gap-2 px-6 py-3 bg-primary text-background font-bold rounded-xl hover:bg-opacity-90 transition-all shadow-glow-primary">
                    Next Step <ArrowRight size={18} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: Setup WhatsApp */}
            {step === 3 && (
              <motion.div key="step3" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }} className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-textPrimary mb-1">Connect WhatsApp</h2>
                  <p className="text-sm text-textMuted">You&apos;re almost there! Link your Meta Developer account.</p>
                </div>

                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
                  <div className="p-4 bg-background border border-border rounded-xl">
                    <ol className="list-decimal list-inside space-y-2 text-sm text-textPrimary">
                      <li>Create an app on <a href="https://developers.facebook.com" target="_blank" className="text-primary hover:underline font-medium">developers.facebook.com</a></li>
                      <li>Add the <b>WhatsApp</b> product</li>
                      <li>Copy your ID & Token below</li>
                    </ol>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-textMuted mb-2">WhatsApp Phone ID</label>
                      <input type="text" value={phoneId} onChange={e=>setPhoneId(e.target.value)} placeholder="e.g. 104593..." className="w-full bg-background border border-border rounded-xl px-4 py-2.5 font-mono text-sm text-textPrimary focus:border-primary focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-textMuted mb-2">Access Token</label>
                      <input type="password" value={accessToken} onChange={e=>setAccessToken(e.target.value)} placeholder="EAA..." className="w-full bg-background border border-border rounded-xl px-4 py-2.5 font-mono text-sm text-textPrimary focus:border-primary focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-textMuted mb-2">Meta App Secret</label>
                      <input type="password" value={appSecret} onChange={e=>setAppSecret(e.target.value)} placeholder="Required to verify webhook signatures" className="w-full bg-background border border-border rounded-xl px-4 py-2.5 font-mono text-sm text-textPrimary focus:border-primary focus:outline-none" />
                    </div>
                  </div>

                  <div className="p-4 bg-background border border-border rounded-xl mt-4">
                    <p className="text-xs font-bold text-textMuted uppercase mb-3">Webhook Configuration</p>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-textMuted w-12">URL:</span>
                        <div className="flex-1 bg-surface border border-border rounded-lg px-2 py-1.5 text-xs font-mono text-textPrimary truncate">{WebhookURL}</div>
                        <button onClick={() => copyToClipboard(WebhookURL)} className="p-1.5 hover:bg-border rounded text-textMuted"><Copy size={14}/></button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-textMuted w-12">Token:</span>
                        <div className="flex-1 bg-surface border border-border rounded-lg px-2 py-1.5 text-xs font-mono text-textPrimary truncate">{verifyToken}</div>
                        <button onClick={() => copyToClipboard(verifyToken)} className="p-1.5 hover:bg-border rounded text-textMuted"><Copy size={14}/></button>
                      </div>
                    </div>
                  </div>
                  
                  {testError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-lg flex items-center gap-2">
                      <AlertCircle size={16}/> {testError}
                    </div>
                  )}
                </div>

                <div className="pt-2 flex justify-between items-center">
                  <button onClick={() => setStep(2)} className="flex items-center gap-2 px-4 py-2 text-textMuted hover:text-textPrimary transition-colors font-medium">
                    <ArrowLeft size={16} /> Back
                  </button>
                  <button onClick={handleTestConnection} disabled={testing} className="flex items-center gap-2 px-6 py-3 bg-primary text-background font-bold rounded-xl hover:bg-opacity-90 transition-all shadow-glow-primary disabled:opacity-50">
                    {testing ? "Verifying..." : "I&apos;ve connected WhatsApp"} <CheckCircle2 size={18} />
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
