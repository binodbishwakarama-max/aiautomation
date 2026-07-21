"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Lock, Mail, User, Building2, Eye, EyeOff, CheckCircle2, Circle, AlertCircle } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { validatePassword, strengthConfig } from "@/lib/password-validation";

type AuthTab = "login" | "signup";

// Inline Google SVG icon — avoids external dependency
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="18" height="18">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function AuthContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "signup" ? "signup" : "login";
  
  const [tab, setTab] = useState<AuthTab>(initialTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [emailConfirmationSent, setEmailConfirmationSent] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  
  const router = useRouter();
  const supabase = createClient();

  const passwordValidation = validatePassword(password);

  // ─── Google OAuth ───
  const handleGoogleSignIn = async () => {
    setError("");
    setIsGoogleLoading(true);
    try {
      const redirectTo = typeof window !== "undefined"
        ? `${window.location.origin}/auth/callback?next=/dashboard`
        : undefined;

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });

      if (oauthError) {
        setError(oauthError.message);
        setIsGoogleLoading(false);
      }
      // On success, the browser redirects — no need to handle here
    } catch {
      setError("Unable to connect to Google. Please try again.");
      setIsGoogleLoading(false);
    }
  };

  // ─── Email/Password Login ───
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

  // ─── Email/Password Signup ───
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!passwordValidation.isValid) {
      setError("Password does not meet all security requirements.");
      return;
    }

    setIsLoading(true);
    try {
      const emailRedirectTo = typeof window !== "undefined"
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
          },
        },
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

  // ─── Forgot Password ───
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setForgotLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback?next=/dashboard`
          : undefined,
      });
      if (resetError) {
        setError(resetError.message);
      } else {
        setForgotSent(true);
      }
    } catch {
      setError("Failed to send reset email.");
    } finally {
      setForgotLoading(false);
    }
  };

  const switchTab = (newTab: AuthTab) => {
    setTab(newTab);
    setError("");
    setEmailConfirmationSent(false);
    setShowForgotPassword(false);
    setForgotSent(false);
  };

  return (
    <div className="min-h-[100dvh] w-full max-w-full bg-background text-textPrimary flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden select-none">
      
      {/* Background ambient glow */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-full max-w-[700px] h-[350px] bg-accent/15 blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo & Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <Link href="/" className="mb-3">
            <Logo size="lg" />
          </Link>
          <h1 className="text-xl font-extrabold text-gradient">
            {tab === "login" ? "Welcome back" : "Create your workspace"}
          </h1>
          <p className="text-xs text-textMuted mt-1">
            {tab === "login"
              ? "Sign in to manage your WhatsApp AI automation"
              : "Start automating WhatsApp inquiries in under 2 minutes"}
          </p>
        </div>

        {/* Auth Card */}
        <div className="glass-card-accent p-5 sm:p-6 rounded-2xl border border-white/10 shadow-2xl">
          
          {/* ─── Google OAuth Hero Button ─── */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white text-[#1f1f1f] font-semibold text-sm hover:bg-gray-50 active:bg-gray-100 transition-all min-h-[48px] border border-gray-200 shadow-sm disabled:opacity-60"
          >
            {isGoogleLoading ? (
              <div className="w-5 h-5 rounded-full border-2 border-gray-400 border-t-transparent animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            <span>{isGoogleLoading ? "Redirecting..." : "Continue with Google"}</span>
          </button>

          {/* ─── Divider ─── */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-textMuted font-bold">or continue with email</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* ─── Tab Toggle ─── */}
          <div className="flex bg-surface border border-border rounded-xl p-1 mb-5">
            <button
              onClick={() => switchTab("login")}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all min-h-[36px] ${
                tab === "login"
                  ? "bg-accent/15 text-accent border border-accent/30"
                  : "text-textMuted hover:text-textPrimary"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => switchTab("signup")}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all min-h-[36px] ${
                tab === "signup"
                  ? "bg-accent/15 text-accent border border-accent/30"
                  : "text-textMuted hover:text-textPrimary"
              }`}
            >
              Create Account
            </button>
          </div>

          {/* ─── Error Banner ─── */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-mono text-center flex items-center justify-center gap-2"
              >
                <AlertCircle size={14} className="shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ─── Email Confirmation Banner ─── */}
          <AnimatePresence>
            {emailConfirmationSent && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-3 bg-accent/10 border border-accent/20 rounded-xl text-accent text-xs font-mono text-center"
              >
                ✓ Account created! Check your email inbox to confirm before signing in.
              </motion.div>
            )}
          </AnimatePresence>

          {/* ─── Forgot Password Inline ─── */}
          <AnimatePresence>
            {showForgotPassword && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4"
              >
                {forgotSent ? (
                  <div className="p-3 bg-accent/10 border border-accent/20 rounded-xl text-accent text-xs font-mono text-center">
                    ✓ Password reset link sent! Check your email inbox.
                  </div>
                ) : (
                  <form onSubmit={handleForgotPassword} className="p-4 bg-surface border border-border rounded-xl space-y-3">
                    <p className="text-xs text-textMuted">Enter your email to receive a password reset link.</p>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="name@company.com"
                      required
                      className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs text-textPrimary focus:outline-none focus:border-accent/40"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(false)}
                        className="flex-1 py-2 text-xs text-textMuted hover:text-textPrimary border border-border rounded-xl transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={forgotLoading}
                        className="flex-1 btn-primary py-2 text-xs font-bold justify-center"
                      >
                        {forgotLoading ? "Sending..." : "Send Reset Link"}
                      </button>
                    </div>
                  </form>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ─── Login Form ─── */}
          <AnimatePresence mode="wait">
            {tab === "login" && !showForgotPassword && (
              <motion.form
                key="login"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleLogin}
                className="space-y-3.5"
              >
                <div>
                  <label className="block text-[10px] font-mono uppercase font-bold tracking-wider text-textMuted mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl pl-9 pr-4 py-2.5 text-base sm:text-xs text-textPrimary focus:outline-none focus:border-accent/40 transition-colors"
                      placeholder="name@company.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[10px] font-mono uppercase font-bold tracking-wider text-textMuted">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-[10px] font-mono text-accent hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl pl-9 pr-10 py-2.5 text-xs text-textPrimary focus:outline-none focus:border-accent/40 transition-colors"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-textMuted hover:text-textPrimary p-1"
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary w-full py-3 text-xs font-bold mt-1 min-h-[44px] flex items-center justify-center gap-2"
                >
                  <span>{isLoading ? "Signing in..." : "Sign In"}</span>
                  {!isLoading && <ArrowRight size={14} />}
                </button>
              </motion.form>
            )}

            {/* ─── Signup Form ─── */}
            {tab === "signup" && (
              <motion.form
                key="signup"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleSignup}
                className="space-y-3"
              >
                <div>
                  <label className="block text-[10px] font-mono uppercase font-bold tracking-wider text-textMuted mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl pl-9 pr-4 py-2.5 text-xs text-textPrimary focus:outline-none focus:border-accent/40"
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
                    <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl pl-9 pr-4 py-2.5 text-xs text-textPrimary focus:outline-none focus:border-accent/40"
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
                    <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl pl-9 pr-4 py-2.5 text-xs text-textPrimary focus:outline-none focus:border-accent/40"
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
                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl pl-9 pr-10 py-2.5 text-xs text-textPrimary focus:outline-none focus:border-accent/40"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-textMuted hover:text-textPrimary p-1"
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>

                  {/* ─── Password Strength Meter ─── */}
                  {password.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-2.5 space-y-2"
                    >
                      {/* Strength Bar */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-surface rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full ${strengthConfig[passwordValidation.strength].bgColor}`}
                            initial={{ width: "0%" }}
                            animate={{ width: `${(passwordValidation.score / 5) * 100}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                        <span className={`text-[10px] font-mono font-bold ${strengthConfig[passwordValidation.strength].color}`}>
                          {strengthConfig[passwordValidation.strength].label}
                        </span>
                      </div>

                      {/* Per-Rule Checklist */}
                      <div className="grid grid-cols-1 gap-1">
                        {passwordValidation.rules.map((rule) => (
                          <div key={rule.id} className="flex items-center gap-1.5 text-[10px]">
                            {rule.met ? (
                              <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
                            ) : (
                              <Circle size={12} className="text-textMuted/40 shrink-0" />
                            )}
                            <span className={rule.met ? "text-emerald-400/90" : "text-textMuted/60"}>
                              {rule.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !passwordValidation.isValid}
                  className="btn-primary w-full py-3 text-xs font-bold mt-1 min-h-[44px] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>{isLoading ? "Creating workspace..." : "Create Free Workspace"}</span>
                  {!isLoading && <ArrowRight size={14} />}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {/* Footer links */}
        <p className="mt-6 text-center text-xs text-textMuted">
          {tab === "login" ? (
            <>
              Don&apos;t have a workspace?{" "}
              <button onClick={() => switchTab("signup")} className="text-accent font-semibold hover:underline">
                Create Account
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button onClick={() => switchTab("login")} className="text-accent font-semibold hover:underline">
                Sign In
              </button>
            </>
          )}
        </p>

        {/* Security footer */}
        <div className="mt-4 text-center">
          <p className="text-[10px] text-textMuted/50 font-mono">
            Protected by AES-256 encryption • SOC 2 compliant infrastructure
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    }>
      <AuthContent />
    </Suspense>
  );
}
