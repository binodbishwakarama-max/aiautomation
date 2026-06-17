"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LandingPageScaffold() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push("/dashboard");
      } else {
        setLoading(false);
      }
    }
    checkUser();
  }, [supabase, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-textMuted text-xs tracking-wider uppercase">Loading...</p>
      </div>
    );
  }

  return (
    <div className="bg-background text-textPrimary min-h-screen flex flex-col font-sans">
      
      {/* HEADER */}
      <header className="border-b border-border py-4 px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="font-bold text-lg">ReplySync</div>
          <nav className="flex gap-6 text-sm">
            <a href="#problem" className="text-textMuted hover:text-textPrimary">Problem</a>
            <a href="#solution" className="text-textMuted hover:text-textPrimary">Solution</a>
            <a href="#proof" className="text-textMuted hover:text-textPrimary">Proof</a>
            <a href="#pricing" className="text-textMuted hover:text-textPrimary">Pricing</a>
          </nav>
          <div className="flex gap-4">
            <Link href="/login" className="text-sm text-textMuted py-2 px-3">Sign In</Link>
            <Link href="/signup" className="text-sm bg-primary text-background py-2 px-4 rounded font-bold">Get Started</Link>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-grow flex flex-col">
        
        {/* HERO SECTION */}
        <section id="hero" className="pt-24 pb-20 px-4 md:px-6 border-b border-border bg-background relative overflow-hidden">
          <div className="max-w-5xl mx-auto text-center">
            
            {/* Focal Point Headline */}
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 bg-gradient-to-b from-white to-slate-300 bg-clip-text text-transparent max-w-4xl mx-auto leading-tight">
              Every WhatsApp message, answered in seconds.
            </h1>
            
            {/* Supporting Subheadline */}
            <p className="text-base md:text-lg text-textMuted max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
              ReplySync replies to customer inquiries instantly with AI trained on your business — so no lead goes cold while you&apos;re busy.
            </p>
            
            {/* Primary & Secondary Action CTAs */}
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
              <Link href="/signup" className="w-full sm:w-auto bg-primary text-background font-bold px-8 py-3.5 rounded-xl transition-all active:scale-95 text-center text-sm shadow-glow-primary">
                Start free
              </Link>
              <a href="#solution" className="w-full sm:w-auto border border-border hover:bg-white/[0.02] text-textPrimary font-semibold px-8 py-3.5 rounded-xl transition-all active:scale-95 text-center text-sm">
                See how it works
              </a>
            </div>

            {/* Product visual: Conversations screen styled as a device mockup */}
            <div className="relative mx-auto max-w-4xl rounded-card border border-border bg-surface overflow-hidden shadow-2xl">
              
              {/* Mockup Frame Bar */}
              <div className="bg-[#0f0f15] px-4 py-3 border-b border-border flex items-center justify-between">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/80"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500/80"></span>
                </div>
                <div className="text-[10px] font-mono text-textMuted select-none">app.replysync.io/conversations</div>
                <div className="w-10"></div>
              </div>

              {/* Mockup Body: Conversations Panel */}
              <div className="grid grid-cols-1 md:grid-cols-12 h-[380px] bg-background">
                
                {/* Left side: Chats List */}
                <div className="md:col-span-4 border-r border-border p-4 flex flex-col gap-3 text-left overflow-y-auto hidden md:flex">
                  <div className="text-[10px] font-bold text-textMuted uppercase tracking-wider mb-1">Recent Conversations</div>
                  
                  {/* Chat Item 1 (Active) */}
                  <div className="p-3 rounded-xl bg-surface border border-border flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-textPrimary">Rahul Sharma</span>
                      <span className="text-[9px] text-primary bg-primary/10 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">AI Active</span>
                    </div>
                    <span className="text-[10px] text-textMuted truncate">Fee structure and batch timings...</span>
                  </div>

                  {/* Chat Item 2 */}
                  <div className="p-3 rounded-xl bg-transparent hover:bg-white/[0.01] transition-colors flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-textMuted">Pooja Patel</span>
                      <span className="text-[9px] text-textMuted">2h ago</span>
                    </div>
                    <span className="text-[10px] text-textMuted truncate">When does the next crash course start?</span>
                  </div>
                </div>

                {/* Right side: Chat Screen */}
                <div className="md:col-span-8 flex flex-col h-full">
                  
                  {/* Chat Header */}
                  <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-surface/50 text-left">
                    <div>
                      <div className="text-xs font-bold text-textPrimary">Rahul Sharma</div>
                      <span className="text-[9px] text-textMuted">Inquiry: Digital Marketing Cohort</span>
                    </div>
                    <span className="text-[10px] text-primary font-bold bg-primary/5 px-2.5 py-1 rounded-full border border-primary/10">
                      Auto-pilot Mode
                    </span>
                  </div>

                  {/* Message Feed */}
                  <div className="flex-1 p-4 flex flex-col gap-4 justify-end text-left overflow-y-auto">
                    
                    {/* User Query */}
                    <div className="flex justify-end">
                      <div className="max-w-[85%] bg-primary text-background font-semibold rounded-2xl rounded-tr-none px-4 py-3 text-xs leading-relaxed shadow-sm">
                        Hi, can you share the pricing structure for the weekend batches? Also, do you provide recording access?
                      </div>
                    </div>

                    {/* AI auto-reply */}
                    <div className="flex justify-start">
                      <div className="max-w-[85%] bg-surface border border-border text-textPrimary rounded-2xl rounded-tl-none px-4 py-3 text-xs leading-relaxed flex flex-col gap-2">
                        <span>Our Weekend Batch fee is ₹12,000/month. Yes, you get lifetime access to all session recordings and classroom materials via our portal.</span>
                        <div className="flex items-center gap-1.5 mt-1 pt-1.5 border-t border-white/5">
                          <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                          <span className="text-[9px] font-bold text-primary uppercase tracking-wider">Replied by ReplySync AI</span>
                        </div>
                      </div>
                    </div>

                  </div>

                </div>

              </div>

            </div>

          </div>
        </section>

        {/* PROBLEM SECTION */}
        <section id="problem" className="py-20 px-6 border-b border-border">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-h1 mb-6 text-center">Problem Section Title Placeholder</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <p className="text-textMuted text-body">Problem Description Text Placeholder</p>
              </div>
              <div className="bg-surface border border-border rounded-card p-6 flex flex-col items-center justify-center">
                <span className="text-textMuted text-xs uppercase tracking-wider mb-2">[Tension / Comparison Stat Frame]</span>
                {/* placeholder stat comment: "Average institute reply time: 4+ hours" */}
              </div>
            </div>
          </div>
        </section>

        {/* SOLUTION SECTION */}
        <section id="solution" className="py-20 px-6 border-b border-border">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-h1 mb-10 text-center">Solution Section Title Placeholder</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-surface border border-border rounded-card p-6">
                <span className="text-primary font-bold text-lg">01</span>
                <h3 className="text-h2 mt-2 mb-1">Step 1 Title Placeholder</h3>
                <p className="text-textMuted text-body">Step 1 description text placeholder</p>
              </div>
              <div className="bg-surface border border-border rounded-card p-6">
                <span className="text-primary font-bold text-lg">02</span>
                <h3 className="text-h2 mt-2 mb-1">Step 2 Title Placeholder</h3>
                <p className="text-textMuted text-body">Step 2 description text placeholder</p>
              </div>
              <div className="bg-surface border border-border rounded-card p-6">
                <span className="text-primary font-bold text-lg">03</span>
                <h3 className="text-h2 mt-2 mb-1">Step 3 Title Placeholder</h3>
                <p className="text-textMuted text-body">Step 3 description text placeholder</p>
              </div>
            </div>
          </div>
        </section>

        {/* PROOF SECTION */}
        <section id="proof" className="py-20 px-6 border-b border-border">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-h1 mb-10 text-center">Proof Section Title Placeholder</h2>
            <div className="space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-h2 mb-2">Panel 1 Title Placeholder</h3>
                  <p className="text-textMuted text-body">Panel 1 description placeholder text.</p>
                </div>
                <div className="aspect-[16/10] bg-surface border border-border rounded-card flex items-center justify-center">
                  <span className="text-textMuted text-xs uppercase tracking-wider">[Panel 1 Screenshot Frame]</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="order-last md:order-first aspect-[16/10] bg-surface border border-border rounded-card flex items-center justify-center">
                  <span className="text-textMuted text-xs uppercase tracking-wider">[Panel 2 Screenshot Frame]</span>
                </div>
                <div>
                  <h3 className="text-h2 mb-2">Panel 2 Title Placeholder</h3>
                  <p className="text-textMuted text-body">Panel 2 description placeholder text.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-h2 mb-2">Panel 3 Title Placeholder</h3>
                  <p className="text-textMuted text-body">Panel 3 description placeholder text.</p>
                </div>
                <div className="aspect-[16/10] bg-surface border border-border rounded-card flex items-center justify-center">
                  <span className="text-textMuted text-xs uppercase tracking-wider">[Panel 3 Screenshot Frame]</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PRICING SECTION */}
        <section id="pricing" className="py-20 px-6 border-b border-border">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-h1 mb-10 text-center">Pricing Section Title Placeholder</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-surface border border-border rounded-card p-8 flex flex-col">
                <h3 className="text-h2 font-bold mb-2">Tier 1 Title</h3>
                <span className="text-textMuted text-xs uppercase tracking-wider mb-4">[Illustrative pricing placeholder]</span>
                <span className="text-3xl font-extrabold mb-6">Price 1</span>
                <ul className="space-y-3 mb-8 text-textMuted text-body">
                  <li>Tier 1 feature point 1</li>
                  <li>Tier 1 feature point 2</li>
                  <li>Tier 1 feature point 3</li>
                </ul>
              </div>
              <div className="bg-surface border border-border rounded-card p-8 flex flex-col">
                <h3 className="text-h2 font-bold mb-2">Tier 2 Title</h3>
                <span className="text-textMuted text-xs uppercase tracking-wider mb-4">[Illustrative pricing placeholder]</span>
                <span className="text-3xl font-extrabold mb-6">Price 2</span>
                <ul className="space-y-3 mb-8 text-textMuted text-body">
                  <li>Tier 2 feature point 1</li>
                  <li>Tier 2 feature point 2</li>
                  <li>Tier 2 feature point 3</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CTA SECTION */}
        <section id="cta" className="py-20 px-6 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-display mb-6">Final CTA Title Placeholder</h2>
            <Link href="/signup" className="bg-primary text-background px-8 py-4 rounded font-bold">Action Button</Link>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-border py-8 px-6 bg-surface">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-textMuted">
          <div>ReplySync logo wordmark</div>
          <div className="flex gap-6">
            <a href="#hero">Back to top</a>
            <a href="/login">Sign In</a>
            <a href="/signup">Get Started</a>
          </div>
          <div>&copy; {new Date().getFullYear()} ReplySync. All rights reserved.</div>
        </div>
      </footer>

    </div>
  );
}
