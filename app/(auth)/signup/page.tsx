"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Lock, Mail, User, Building2, Eye, EyeOff } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [emailConfirmationSent, setEmailConfirmationSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const emailRedirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback?next=/onboarding`
          : undefined;

      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo,
          data: {
            name,
            business_name: businessName,
          }
        }
      });

      if (signUpError) {
        setError(signUpError.message);
        setIsLoading(false);
        return;
      }

      if (authData.session) {
        router.push("/onboarding");
        router.refresh();
      } else {
        setEmailConfirmationSent(true);
      }
    } catch {
      setError("An unexpected error occurred during signup.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-textPrimary flex flex-col items-center justify-center p-6 relative overflow-hidden select-none">
      
      {/* Ambient background glow */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-accent/15 blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass-card-accent p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl relative z-10"
      >
        <div className="flex flex-col items-center text-center mb-8">
          <Link href="/" className="mb-4">
            <Logo size="lg" />
          </Link>
          <h1 className="text-xl font-extrabold text-gradient">Create your workspace</h1>
          <p className="text-xs text-textMuted mt-1">Start automating Meta WhatsApp inquiries in under 2 minutes</p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-mono text-center">
            {error}
          </div>
        )}

        {emailConfirmationSent && (
          <div className="mb-6 p-3.5 bg-accent/10 border border-accent/20 rounded-xl text-accent text-xs font-mono text-center">
            Account created! Check your email inbox to confirm registration before signing in.
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-[10px] font-mono uppercase font-bold tracking-wider text-textMuted mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-textMuted" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2.5 text-xs text-textPrimary focus:outline-none focus:border-accent/40"
                placeholder="John Doe"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase font-bold tracking-wider text-textMuted mb-1.5">
              Work Email Address
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-textMuted" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2.5 text-xs text-textPrimary focus:outline-none focus:border-accent/40"
                placeholder="you@company.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase font-bold tracking-wider text-textMuted mb-1.5">
              Organization / Business Name
            </label>
            <div className="relative">
              <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-textMuted" />
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2.5 text-xs text-textPrimary focus:outline-none focus:border-accent/40"
                placeholder="Acme Business Corp"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase font-bold tracking-wider text-textMuted mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-textMuted" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-background border border-border rounded-xl pl-10 pr-10 py-2.5 text-xs text-textPrimary focus:outline-none focus:border-accent/40"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-textMuted hover:text-textPrimary"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full py-3.5 text-xs font-bold mt-2"
          >
            <span>{isLoading ? "Deploying Workspace..." : "Create Free Workspace"}</span>
            <ArrowRight size={14} />
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-textMuted">
          Already have an account?{" "}
          <Link href="/login" className="text-accent font-semibold hover:underline">
            Sign In
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
