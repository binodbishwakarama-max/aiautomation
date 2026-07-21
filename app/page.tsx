"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  UserCheck, 
  ChevronDown,
  Zap,
  Radio,
  Menu,
  X,
  ExternalLink,
  Key,
  Globe,
  FileText
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";

export default function LandingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [monthlyMessages, setMonthlyMessages] = useState(3500);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [consoleTab, setConsoleTab] = useState<'stream' | 'telemetry'>('stream');
  const [mobileConsolePane, setMobileConsolePane] = useState<'queue' | 'thread'>('thread');

  useEffect(() => {
    async function checkUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push("/dashboard");
      } else {
        setLoading(false);
      }
    }
    void checkUser();
  }, [supabase, router]);

  // Operator ROI calculations
  const hoursSaved = Math.round((monthlyMessages * 2.5) / 60);
  const dollarsSaved = Math.round(hoursSaved * 18);

  const faqs = [
    {
      q: "How does ReplySync connect to my Meta WhatsApp Business number?",
      a: "ReplySync connects directly to the official Meta Graph API via Webhooks. Enter your Meta System User Access Token and Phone Number ID in Settings. Connections take under 2 minutes."
    },
    {
      q: "What happens when an inbound message falls below confidence thresholds?",
      a: "ReplySync automatically flags the thread as 'Escalated', pauses AI automated dispatch, and alerts your team via the live console so an operator can take over without customer disruption."
    },
    {
      q: "Can I train the AI on custom PDF guides, price lists, or refund policies?",
      a: "Yes. Add your business rules into the FAQ RAG Knowledge Base. ReplySync converts documents into vector embeddings and retrieves exact matching facts before answering."
    },
    {
      q: "How are customer access tokens and phone numbers secured?",
      a: "All Meta API tokens are encrypted at rest using AES-256-GCM. Row Level Security (RLS) policies isolate workspace data so no cross-tenant leakage is possible."
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 gap-3 text-center">
        <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
        <p className="text-textMuted text-xs font-mono tracking-widest uppercase">Connecting to Dispatch Engine...</p>
      </div>
    );
  }

  return (
    <div className="bg-background text-textPrimary min-h-screen flex flex-col font-sans selection:bg-accent/20">
      
      {/* HEADER NAVBAR (MOBILE FIRST: 375px - 390px Viewport Target) */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-background/95 border-b border-border px-4 sm:px-6">
        <div className="max-w-7xl mx-auto h-16 flex justify-between items-center">
          
          {/* Logo Mark */}
          <Link href="/" className="flex items-center gap-2.5 min-h-[44px]">
            <Logo size="md" />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-xs font-medium text-textMuted">
            <a href="#how-it-works" className="hover:text-textPrimary transition-colors py-2">How It Works</a>
            <a href="#console" className="hover:text-textPrimary transition-colors py-2">Dispatch Console</a>
            <a href="#features" className="hover:text-textPrimary transition-colors py-2">Capabilities</a>
            <a href="#calculator" className="hover:text-textPrimary transition-colors py-2">Calculator</a>
            <a href="#pricing" className="hover:text-textPrimary transition-colors py-2">Pricing</a>
            <a href="#faq" className="hover:text-textPrimary transition-colors py-2">FAQ</a>
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="text-xs font-medium text-textMuted hover:text-textPrimary px-3 py-2 transition-colors min-h-[44px] flex items-center">
              Sign In
            </Link>
            <Link href="/signup" className="btn-primary text-xs min-h-[44px] flex items-center justify-center px-4">
              <span>Connect WhatsApp</span>
              <ArrowRight size={14} className="ml-1.5 shrink-0" />
            </Link>
          </div>

          {/* Mobile Menu Hamburger Button (Minimum 44x44px Tap Target) */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-lg text-textMuted hover:text-textPrimary bg-surface border border-border focus:ring-2 focus:ring-accent"
            aria-label="Toggle Navigation Menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Navigation Drawer Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background px-4 pt-4 pb-6 space-y-3 flex flex-col">
            <a 
              href="#how-it-works" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-textPrimary py-3 px-3 rounded-lg bg-surface/50 border border-border flex items-center min-h-[44px]"
            >
              How It Works & Setup Guide
            </a>
            <a 
              href="#console" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-textPrimary py-3 px-3 rounded-lg bg-surface/50 border border-border flex items-center min-h-[44px]"
            >
              Dispatch Console
            </a>
            <a 
              href="#features" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-textPrimary py-3 px-3 rounded-lg bg-surface/50 border border-border flex items-center min-h-[44px]"
            >
              Capabilities
            </a>
            <a 
              href="#calculator" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-textPrimary py-3 px-3 rounded-lg bg-surface/50 border border-border flex items-center min-h-[44px]"
            >
              Calculator
            </a>
            <a 
              href="#pricing" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-textPrimary py-3 px-3 rounded-lg bg-surface/50 border border-border flex items-center min-h-[44px]"
            >
              Pricing
            </a>
            <a 
              href="#faq" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-textPrimary py-3 px-3 rounded-lg bg-surface/50 border border-border flex items-center min-h-[44px]"
            >
              FAQ
            </a>
            
            <div className="pt-2 border-t border-border flex flex-col gap-2.5">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (typeof window !== "undefined") {
                    window.dispatchEvent(new Event("open-pwa-prompt"));
                  }
                }}
                className="w-full py-3 px-3 rounded-lg bg-accent/15 border border-accent/40 text-accent font-bold text-sm min-h-[44px] flex items-center justify-center gap-2"
              >
                <span>Install ReplySync Mobile App</span>
              </button>
              <Link 
                href="/login" 
                onClick={() => setMobileMenuOpen(false)}
                className="btn-secondary text-center text-sm min-h-[44px] flex items-center justify-center"
              >
                Sign In
              </Link>
              <Link 
                href="/signup" 
                onClick={() => setMobileMenuOpen(false)}
                className="btn-primary text-center text-sm min-h-[44px] flex items-center justify-center font-bold"
              >
                <span>Connect WhatsApp</span>
                <ArrowRight size={16} className="ml-2" />
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-grow z-10">
        
        {/* HERO SECTION (MOBILE FIRST: Single Column Stacking & 16px Base Body Font) */}
        <section className="pt-10 sm:pt-16 pb-12 sm:pb-14 px-4 sm:px-6 border-b border-border/60">
          <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
            
            {/* Rescaled Headline for Mobile (375px target: text-2xl leading-tight) */}
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-4 sm:mb-6 text-textPrimary leading-[1.25] sm:leading-tight">
              Automate WhatsApp support. Qualify leads. Hand off to humans instantly.
            </h1>

            {/* Plain Active Copy (16px base font to prevent iOS input zoom) */}
            <p className="text-base sm:text-lg text-textMuted max-w-2xl mb-8 leading-relaxed px-1">
              ReplySync indexes your business FAQs, processes incoming WhatsApp customer inquiries with Groq AI, captures intent leads, and alerts human operators when intervention is required.
            </p>

            {/* Touch CTAs (Full width on mobile, 48px height) */}
            <div className="flex flex-col sm:flex-row gap-3.5 mb-8 w-full sm:w-auto justify-center">
              <Link href="/signup" className="btn-primary py-3.5 px-6 text-sm font-bold min-h-[48px] flex items-center justify-center w-full sm:w-auto">
                <span>Start Free Dispatch Trial</span>
                <ArrowRight size={16} className="ml-2 shrink-0" />
              </Link>
              <a href="#console" className="btn-secondary py-3.5 px-6 text-sm font-semibold min-h-[48px] flex items-center justify-center w-full sm:w-auto">
                <span>View Live Console Simulation</span>
              </a>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS & META DEVELOPER SETUP GUIDE */}
        <section id="how-it-works" className="py-12 sm:py-16 px-4 sm:px-6 border-b border-border bg-[#0a0f12]">
          <div className="max-w-5xl mx-auto">
            
            <div className="text-center max-w-3xl mx-auto mb-10">
              <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-accent mb-2">
                STEP-BY-STEP SETUP GUIDE
              </h2>
              <p className="text-2xl sm:text-3xl font-extrabold text-textPrimary tracking-tight mb-3">
                How ReplySync Automates WhatsApp in 4 Easy Steps
              </p>
              <p className="text-sm text-textMuted leading-relaxed">
                Clear instructions on getting your Meta Developer credentials, Phone Number ID, and activating 24/7 AI dispatching.
              </p>
            </div>

            {/* 4 Step Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              
              {/* Step 1 */}
              <div className="glass-card p-5 sm:p-6 rounded-xl border border-border flex flex-col justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-accent px-2.5 py-1 rounded bg-accent/10 border border-accent/20">
                      STEP 01
                    </span>
                    <a 
                      href="https://developers.facebook.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs font-mono text-textMuted hover:text-accent inline-flex items-center gap-1 transition-colors"
                    >
                      <span>developers.facebook.com</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                  <h3 className="text-base font-bold text-textPrimary flex items-center gap-2">
                    <Globe size={18} className="text-accent shrink-0" />
                    Create Meta Developer Account
                  </h3>
                  <p className="text-xs sm:text-sm text-textMuted leading-relaxed">
                    Log in to Meta for Developers. Click <strong className="text-textPrimary">My Apps</strong> &rarr; <strong className="text-textPrimary">Create App</strong>. Select <strong className="text-textPrimary">Other &rarr; Business</strong> as your app type, then add the <strong className="text-textPrimary">WhatsApp</strong> product.
                  </p>
                </div>

                <div className="p-3 rounded bg-background/60 border border-border text-[11px] font-mono text-textMuted">
                  <span className="text-accent font-bold">Requirement:</span> Meta Developer Account & Facebook Business Manager
                </div>
              </div>

              {/* Step 2 */}
              <div className="glass-card p-5 sm:p-6 rounded-xl border border-border flex flex-col justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-accent px-2.5 py-1 rounded bg-accent/10 border border-accent/20">
                      STEP 02
                    </span>
                    <span className="text-xs font-mono text-textMuted">Meta API Setup</span>
                  </div>
                  <h3 className="text-base font-bold text-textPrimary flex items-center gap-2">
                    <Key size={18} className="text-accent shrink-0" />
                    Get Phone Number ID & Access Token
                  </h3>
                  <p className="text-xs sm:text-sm text-textMuted leading-relaxed">
                    Inside your Meta App, go to <strong className="text-textPrimary">WhatsApp &rarr; API Setup</strong>. Copy your 15-digit <strong className="text-textPrimary">Phone Number ID</strong> and generate a System User <strong className="text-textPrimary">Permanent Access Token</strong> (or temporary test token).
                  </p>
                </div>

                <div className="p-3 rounded bg-background/60 border border-border text-[11px] font-mono text-textMuted">
                  <span className="text-accent font-bold">Example Phone ID:</span> 104829384910293
                </div>
              </div>

              {/* Step 3 */}
              <div className="glass-card p-5 sm:p-6 rounded-xl border border-border flex flex-col justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-accent px-2.5 py-1 rounded bg-accent/10 border border-accent/20">
                      STEP 03
                    </span>
                    <span className="text-xs font-mono text-textMuted">ReplySync Dashboard</span>
                  </div>
                  <h3 className="text-base font-bold text-textPrimary flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-accent shrink-0" />
                    Save Connection in ReplySync Settings
                  </h3>
                  <p className="text-xs sm:text-sm text-textMuted leading-relaxed">
                    Log in to your ReplySync account, navigate to <strong className="text-textPrimary">Settings</strong> (<code className="text-accent font-mono text-[11px]">/settings</code>), paste your Phone Number ID and Access Token, and click <strong className="text-textPrimary">Save WhatsApp Config</strong>.
                  </p>
                </div>

                <div className="p-3 rounded bg-background/60 border border-border text-[11px] font-mono text-textMuted">
                  <span className="text-accent font-bold">Security:</span> Encrypted at rest with AES-256-GCM
                </div>
              </div>

              {/* Step 4 */}
              <div className="glass-card p-5 sm:p-6 rounded-xl border border-border flex flex-col justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-accent px-2.5 py-1 rounded bg-accent/10 border border-accent/20">
                      STEP 04
                    </span>
                    <span className="text-xs font-mono text-textMuted">AI Knowledge Base</span>
                  </div>
                  <h3 className="text-base font-bold text-textPrimary flex items-center gap-2">
                    <FileText size={18} className="text-accent shrink-0" />
                    Add Business Rules & Launch Dispatch
                  </h3>
                  <p className="text-xs sm:text-sm text-textMuted leading-relaxed">
                    Add your business FAQs, product catalog, refund policies, and pricing guide into the Knowledge Base. ReplySync starts auto-answering WhatsApp customers 24/7 with zero latency!
                  </p>
                </div>

                <div className="p-3 rounded bg-background/60 border border-border text-[11px] font-mono text-accent">
                  <span className="font-bold">&check; Ready:</span> Auto-answers inquiries & qualifies leads
                </div>
              </div>
            </div>

            {/* Quick Action CTA Box */}
            <div className="mt-8 p-6 rounded-xl bg-surface border border-accent/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
              <div>
                <h4 className="text-base font-bold text-textPrimary">Ready to connect your Meta WhatsApp API?</h4>
                <p className="text-xs text-textMuted mt-1">Set up your workspace in under 2 minutes. No credit card required.</p>
              </div>
              <Link href="/signup" className="btn-primary py-3 px-6 text-xs font-bold shrink-0 min-h-[44px] flex items-center justify-center">
                <span>Start Free Setup</span>
                <ArrowRight size={14} className="ml-1.5" />
              </Link>
            </div>

          </div>
        </section>

        {/* SIGNATURE ELEMENT: AIR TRAFFIC CONTROL DISPATCH CONSOLE (MOBILE-FIRST ADAPTIVE) */}
        <section id="console" className="py-10 sm:py-16 px-3 sm:px-6 bg-[#090e11] border-b border-border">
          <div className="max-w-5xl mx-auto">
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
              <div>
                <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-accent">
                  SIGNATURE CONTROL PLANE
                </h2>
                <p className="text-sm font-semibold text-textPrimary">
                  Live WhatsApp Signal Dispatch & Vector Telemetry
                </p>
              </div>

              {/* Console Mode Toggle (44px Minimum Touch Area) */}
              <div className="flex bg-surface p-1 rounded border border-border text-xs font-mono w-full sm:w-auto">
                <button 
                  onClick={() => setConsoleTab('stream')}
                  className={`flex-1 sm:flex-initial min-h-[40px] px-3 py-2 rounded transition-colors ${consoleTab === 'stream' ? 'bg-accent/15 text-accent font-bold' : 'text-textMuted hover:text-textPrimary'}`}
                >
                  Live Thread Stream
                </button>
                <button 
                  onClick={() => setConsoleTab('telemetry')}
                  className={`flex-1 sm:flex-initial min-h-[40px] px-3 py-2 rounded transition-colors ${consoleTab === 'telemetry' ? 'bg-accent/15 text-accent font-bold' : 'text-textMuted hover:text-textPrimary'}`}
                >
                  Vector Telemetry Log
                </button>
              </div>
            </div>

            {/* Mobile View Switcher (Visible only below md: 768px) */}
            {consoleTab === 'stream' && (
              <div className="flex md:hidden mb-3 bg-surface p-1 rounded border border-border text-xs font-mono">
                <button
                  onClick={() => setMobileConsolePane('thread')}
                  className={`flex-1 min-h-[40px] py-2 rounded font-bold transition-colors ${mobileConsolePane === 'thread' ? 'bg-background text-accent border border-border' : 'text-textMuted'}`}
                >
                  Active Conversation
                </button>
                <button
                  onClick={() => setMobileConsolePane('queue')}
                  className={`flex-1 min-h-[40px] py-2 rounded font-bold transition-colors ${mobileConsolePane === 'queue' ? 'bg-background text-accent border border-border' : 'text-textMuted'}`}
                >
                  Queue (3)
                </button>
              </div>
            )}

            {/* Console Screen Container */}
            <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-2xl">
              
              {/* Telemetry Header Bar */}
              <div className="bg-background px-3 sm:px-4 py-2.5 border-b border-border flex items-center justify-between font-mono text-[11px]">
                <div className="flex items-center gap-2 text-textMuted truncate">
                  <Radio size={12} className="text-accent animate-pulse shrink-0" />
                  <span className="truncate">META_WHATSAPP_CLOUD_API</span>
                  <span className="text-accent font-bold shrink-0">200 OK</span>
                </div>
                <div className="text-textMuted shrink-0 ml-2">
                  <span className="text-textPrimary font-bold">142ms</span>
                </div>
              </div>

              {/* Console Body */}
              {consoleTab === 'stream' ? (
                <div className="grid grid-cols-1 md:grid-cols-12 min-h-[360px]">
                  
                  {/* Left Queue (Visible on desktop, or when mobileConsolePane === 'queue' on mobile) */}
                  <div className={`md:col-span-4 border-r border-border p-3 flex-col gap-2 bg-background/50 ${mobileConsolePane === 'queue' ? 'flex' : 'hidden md:flex'}`}>
                    <div className="text-[10px] font-mono uppercase text-textMuted font-bold px-1 mb-1">
                      Inbound Queue (3 Threads)
                    </div>

                    <button 
                      onClick={() => setMobileConsolePane('thread')}
                      className="p-3 rounded border border-accent/40 bg-accent/5 flex flex-col gap-1 text-left min-h-[44px]"
                    >
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-textPrimary">Ananya Verma</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-accent/20 text-accent font-bold">AI DISPATCH</span>
                      </div>
                      <p className="text-[11px] text-textMuted truncate">What is the tuition fee for the upcoming AI Engineering cohort?</p>
                      <span className="text-[9px] font-mono text-textMuted">09:41 AM • +91 98200 *****</span>
                    </button>

                    <div className="p-3 rounded border border-border bg-surface/50 flex flex-col gap-1 opacity-75 min-h-[44px]">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-textPrimary">Vikram Mehta</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-400/20 text-emerald-400 font-bold">LEAD QUALIFIED</span>
                      </div>
                      <p className="text-[11px] text-textMuted truncate">Enrolled in FullStack cohort. Send receipt.</p>
                      <span className="text-[9px] font-mono text-textMuted">09:38 AM • +91 98711 *****</span>
                    </div>

                    <div className="p-3 rounded border border-warning/30 bg-warning/5 flex flex-col gap-1 min-h-[44px]">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-textPrimary">Karan Shah</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-warning/20 text-warning font-bold">HUMAN REQUIRED</span>
                      </div>
                      <p className="text-[11px] text-textMuted truncate">Requesting refund for payment #8912</p>
                      <span className="text-[9px] font-mono text-textMuted">09:32 AM • +91 97110 *****</span>
                    </div>
                  </div>

                  {/* Right Active Dispatch Pane (Visible on desktop, or when mobileConsolePane === 'thread' on mobile) */}
                  <div className={`md:col-span-8 p-4 sm:p-5 flex-col justify-between ${mobileConsolePane === 'thread' ? 'flex' : 'hidden md:flex'}`}>
                    <div className="space-y-4">
                      
                      {/* Customer Inbound Bubble */}
                      <div className="flex flex-col items-end">
                        <div className="max-w-[92%] sm:max-w-[85%] bg-surface border border-border p-3 sm:p-3.5 rounded-lg text-xs sm:text-sm">
                          <p className="text-textPrimary leading-relaxed">Hi! What is the tuition fee for the upcoming AI Engineering bootcamp? Do you offer flexible EMI installment options?</p>
                        </div>
                        <span className="text-[9px] font-mono text-textMuted mt-1">CUSTOMER • 09:41 AM</span>
                      </div>

                      {/* AI Dispatch Response */}
                      <div className="flex flex-col items-start">
                        <div className="max-w-[92%] sm:max-w-[85%] bg-background border border-accent/30 p-3.5 sm:p-4 rounded-lg text-xs sm:text-sm space-y-2">
                          <div className="flex items-center justify-between border-b border-border pb-2 text-[10px] font-mono">
                            <span className="text-accent font-bold flex items-center gap-1">
                              <Zap size={12} strokeWidth={2.5} />
                              AI DISPATCH AUTOMATED
                            </span>
                            <span className="text-textMuted">Match: 98.4%</span>
                          </div>
                          <p className="text-textPrimary leading-relaxed">
                            Hello Ananya! The AI Engineering Bootcamp fee is ₹18,500. Yes, we offer 2-month zero-cost EMI installment options.
                          </p>
                          <p className="text-textPrimary leading-relaxed">
                            Would you like me to send over the full syllabus brochure and direct seat registration link?
                          </p>

                          <div className="p-2 rounded bg-accent/10 border border-accent/20 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[10px] font-mono text-accent">
                            <span className="flex items-center gap-1 font-bold">
                              <UserCheck size={12} />
                              EVENT: LEAD_QUALIFIED
                            </span>
                            <span className="text-textMuted">Recorded to DB</span>
                          </div>
                        </div>
                        <span className="text-[9px] font-mono text-textMuted mt-1">REPLYSYNC AI DISPATCH • 09:41 AM</span>
                      </div>
                    </div>

                    {/* Operational Action Bar (Touch-Optimized) */}
                    <div className="pt-4 border-t border-border mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs font-mono">
                      <span className="text-textMuted text-center sm:text-left">Operator Handoff: <span className="text-accent font-bold">AI Active</span></span>
                      <button className="min-h-[44px] w-full sm:w-auto px-4 py-2.5 rounded bg-warning/10 border border-warning/30 text-warning font-bold hover:bg-warning/20 transition-colors flex items-center justify-center">
                        Takeover Thread Manually
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 sm:p-6 bg-background grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 font-mono text-xs">
                  <div className="p-4 rounded border border-border bg-surface flex flex-col gap-1.5">
                    <span className="text-[10px] text-textMuted uppercase">Vector Index Match</span>
                    <span className="text-2xl font-bold text-accent">98.4%</span>
                    <span className="text-[10px] text-textMuted">RAG Rule matched: FAQ #14 (Tuition & Fees)</span>
                  </div>

                  <div className="p-4 rounded border border-border bg-surface flex flex-col gap-1.5">
                    <span className="text-[10px] text-textMuted uppercase">Groq AI Processing Time</span>
                    <span className="text-2xl font-bold text-textPrimary">1.2s</span>
                    <span className="text-[10px] text-textMuted">Model: llama-3.1-8b-instant</span>
                  </div>

                  <div className="p-4 rounded border border-border bg-surface flex flex-col gap-1.5">
                    <span className="text-[10px] text-textMuted uppercase">Tenant Data Isolation</span>
                    <span className="text-2xl font-bold text-emerald-400">AES-256</span>
                    <span className="text-[10px] text-textMuted">Row Level Security (RLS) active</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* CORE CAPABILITIES GRID (MOBILE-FIRST 1-COLUMN DEFAULT STACK) */}
        <section id="features" className="py-12 sm:py-16 px-4 sm:px-6 border-b border-border">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-accent mb-2">
              ENGINEERING CAPABILITIES
            </h2>
            <p className="text-lg sm:text-xl font-bold text-textPrimary mb-8">
              Built for high-volume customer message dispatch.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              
              <div className="glass-card p-5 sm:p-6 rounded-xl flex flex-col gap-3">
                <div className="w-9 h-9 rounded bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
                  <Zap size={18} />
                </div>
                <h3 className="text-base font-bold text-textPrimary">Zero Latency Automated Responses</h3>
                <p className="text-sm text-textMuted leading-relaxed">
                  Connect your Meta WhatsApp API in under 2 minutes. Automated responses dispatch in under 1.5 seconds.
                </p>
              </div>

              <div className="glass-card p-5 sm:p-6 rounded-xl flex flex-col gap-3">
                <div className="w-9 h-9 rounded bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
                  <UserCheck size={18} />
                </div>
                <h3 className="text-base font-bold text-textPrimary">Lead Intent Qualification</h3>
                <p className="text-sm text-textMuted leading-relaxed">
                  Automatically tag prospects by intent level, extract phone numbers, and export structured lead lists to CSV.
                </p>
              </div>

              <div className="glass-card p-5 sm:p-6 rounded-xl flex flex-col gap-3">
                <div className="w-9 h-9 rounded bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
                  <ShieldCheck size={18} />
                </div>
                <h3 className="text-base font-bold text-textPrimary">Graceful Human Handoff</h3>
                <p className="text-sm text-textMuted leading-relaxed">
                  When confidence drops, ReplySync flags threads for manual takeover so your team never misses critical customer requests.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* OPERATOR ROI CALCULATOR (MOBILE-FIRST TOUCH SLIDER) */}
        <section id="calculator" className="py-12 sm:py-16 px-4 sm:px-6 bg-[#090e11] border-b border-border">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-accent mb-2">
              CAPACITY CALCULATOR
            </h2>
            <p className="text-lg sm:text-xl font-bold text-textPrimary mb-6">
              Calculate operator hours reclaimed per month.
            </p>

            <div className="glass-card p-5 sm:p-8 rounded-xl grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-center">
              
              <div className="md:col-span-7 space-y-5">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1">
                  <label htmlFor="msg-slider" className="text-xs font-mono text-textMuted uppercase font-bold">
                    Monthly Inbound Messages
                  </label>
                  <span className="text-lg font-bold text-accent font-mono">{monthlyMessages.toLocaleString()} msgs</span>
                </div>

                {/* Touch Slider (44px Minimum Touch Height) */}
                <input 
                  id="msg-slider"
                  type="range" 
                  min="500" 
                  max="25000" 
                  step="500"
                  value={monthlyMessages}
                  onChange={(e) => setMonthlyMessages(Number(e.target.value))}
                  className="w-full h-3 bg-background rounded-lg appearance-none cursor-pointer accent-accent min-h-[44px] py-2"
                />

                <div className="flex justify-between text-[10px] font-mono text-textMuted">
                  <span>500 msgs</span>
                  <span>12,500 msgs</span>
                  <span>25,000 msgs</span>
                </div>
              </div>

              <div className="md:col-span-5 bg-background p-5 rounded-lg border border-border flex flex-col gap-4 text-center">
                <div>
                  <span className="text-[10px] font-mono text-textMuted uppercase block">Support Hours Saved</span>
                  <span className="text-2xl sm:text-3xl font-extrabold text-textPrimary font-mono">{hoursSaved} hrs/mo</span>
                </div>

                <div className="pt-3 border-t border-border">
                  <span className="text-[10px] font-mono text-textMuted uppercase block">Estimated Cost Reduction</span>
                  <span className="text-xl sm:text-2xl font-bold text-accent font-mono">${dollarsSaved.toLocaleString()} / mo</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PRICING PLANS (SINGLE COLUMN DEFAULT) */}
        <section id="pricing" className="py-12 sm:py-16 px-4 sm:px-6 border-b border-border">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-accent mb-2">
              PRICING TIERS
            </h2>
            <p className="text-lg sm:text-xl font-bold text-textPrimary mb-8">
              Transparent volume-based plans. Cancel anytime.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Starter Plan */}
              <div className="glass-card p-6 rounded-xl flex flex-col justify-between">
                <div>
                  <span className="text-xs font-mono text-textMuted uppercase font-bold">Starter Dispatch</span>
                  <div className="text-3xl font-extrabold text-textPrimary my-3 font-mono">$29 <span className="text-xs text-textMuted font-sans">/ mo</span></div>
                  <p className="text-xs text-textMuted mb-6">Ideal for small businesses initiating WhatsApp automation.</p>
                  
                  <ul className="space-y-3 text-xs text-textMuted mb-8">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-accent shrink-0" />
                      <span>Up to 1,000 msgs / month</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-accent shrink-0" />
                      <span>1 WhatsApp Number ID</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-accent shrink-0" />
                      <span>Lead CSV Export</span>
                    </li>
                  </ul>
                </div>
                <Link href="/signup" className="btn-secondary text-center text-xs min-h-[44px] flex items-center justify-center font-semibold">
                  Get Starter Plan
                </Link>
              </div>

              {/* Pro Plan (Highlighted) */}
              <div className="glass-card-accent p-6 rounded-xl flex flex-col justify-between relative mt-2 sm:mt-0">
                <span className="absolute -top-3 right-6 text-[9px] font-mono font-bold uppercase bg-accent text-background px-2.5 py-1 rounded">
                  Most Popular
                </span>
                <div>
                  <span className="text-xs font-mono text-accent uppercase font-bold">Growth Pro Dispatch</span>
                  <div className="text-3xl font-extrabold text-textPrimary my-3 font-mono">$79 <span className="text-xs text-textMuted font-sans">/ mo</span></div>
                  <p className="text-xs text-textMuted mb-6">For teams managing high-volume incoming sales inquiries.</p>
                  
                  <ul className="space-y-3 text-xs text-textPrimary mb-8">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-accent shrink-0" />
                      <span>Up to 5,000 msgs / month</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-accent shrink-0" />
                      <span>RAG Document FAQ Base</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-accent shrink-0" />
                      <span>Human Takeover Alerts</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-accent shrink-0" />
                      <span>Whisper Voice Transcription</span>
                    </li>
                  </ul>
                </div>
                <Link href="/signup" className="btn-primary text-center text-xs min-h-[44px] flex items-center justify-center font-bold">
                  Start Growth Pro
                </Link>
              </div>

              {/* Enterprise Plan */}
              <div className="glass-card p-6 rounded-xl flex flex-col justify-between">
                <div>
                  <span className="text-xs font-mono text-textMuted uppercase font-bold">Enterprise Scale</span>
                  <div className="text-3xl font-extrabold text-textPrimary my-3 font-mono">$199 <span className="text-xs text-textMuted font-sans">/ mo</span></div>
                  <p className="text-xs text-textMuted mb-6">Custom volume dispatching with dedicated SLAs.</p>
                  
                  <ul className="space-y-3 text-xs text-textMuted mb-8">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-accent shrink-0" />
                      <span>Unlimited Monthly Messages</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-accent shrink-0" />
                      <span>Multi-Number Workspaces</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-accent shrink-0" />
                      <span>Dedicated Support</span>
                    </li>
                  </ul>
                </div>
                <Link href="/signup" className="btn-secondary text-center text-xs min-h-[44px] flex items-center justify-center font-semibold">
                  Contact Sales
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ ACCORDION (TOUCH DISCLOSURE) */}
        <section id="faq" className="py-12 sm:py-16 px-4 sm:px-6 bg-[#090e11]">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-accent mb-2">
              FREQUENTLY ASKED QUESTIONS
            </h2>
            <p className="text-lg sm:text-xl font-bold text-textPrimary mb-6">
              Technical details and integration specifications.
            </p>

            <div className="space-y-3">
              {faqs.map((faq, index) => {
                const isOpen = activeFaq === index;
                return (
                  <div key={index} className="glass-card rounded-lg overflow-hidden">
                    <button 
                      onClick={() => setActiveFaq(isOpen ? null : index)}
                      className="w-full px-4 sm:px-5 py-4 text-left flex justify-between items-center text-xs sm:text-sm font-bold text-textPrimary hover:bg-surfaceHover transition-colors min-h-[48px]"
                    >
                      <span className="pr-2">{faq.q}</span>
                      <ChevronDown size={18} className={`shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-accent' : 'text-textMuted'}`} />
                    </button>
                    {isOpen && (
                      <div className="px-4 sm:px-5 pb-4 text-xs sm:text-sm text-textMuted leading-relaxed border-t border-border/40 pt-3">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="py-8 px-4 sm:px-6 border-t border-border text-xs text-textMuted">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
            <Logo size="sm" />
            <span className="font-mono text-[10px]">© 2026 ReplySync Inc. All rights reserved.</span>
          </div>
          <div className="flex gap-4 sm:gap-6 font-mono text-[11px]">
            <a href="#console" className="hover:text-textPrimary py-1">Console</a>
            <a href="#privacy" className="hover:text-textPrimary py-1">Privacy Policy</a>
            <a href="#terms" className="hover:text-textPrimary py-1">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
