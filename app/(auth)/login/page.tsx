"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Lock, Mail, Eye, EyeOff } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setIsLoading(false);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred during sign in.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-textPrimary flex flex-col items-center justify-center p-6 relative overflow-hidden select-none">
      
      {/* Background ambient light */}
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
          <h1 className="text-xl font-extrabold text-gradient">Welcome back</h1>
          <p className="text-xs text-textMuted mt-1">Sign in to manage your WhatsApp Cloud AI automation</p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-mono text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[10px] font-mono uppercase font-bold tracking-wider text-textMuted mb-2">
              Work Email Address
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-textMuted" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3 text-xs text-textPrimary focus:outline-none focus:border-accent/40 transition-colors"
                placeholder="name@company.com"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[10px] font-mono uppercase font-bold tracking-wider text-textMuted">
                Password
              </label>
              <Link href="/forgot-password" className="text-[11px] font-mono text-accent hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-textMuted" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-background border border-border rounded-xl pl-10 pr-10 py-3 text-xs text-textPrimary focus:outline-none focus:border-accent/40 transition-colors"
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
            <span>{isLoading ? "Signing in..." : "Sign in to Control Plane"}</span>
            <ArrowRight size={14} />
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-textMuted">
          Don&apos;t have a workspace?{" "}
          <Link href="/signup" className="text-accent font-semibold hover:underline">
            Start Free Trial
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
