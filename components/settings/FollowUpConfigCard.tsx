"use client";

import { LockKeyhole } from "lucide-react";

interface FollowUpConfigCardProps {
  followUpEnabled: boolean;
  setFollowUpEnabled: (v: boolean) => void;
  followUpTemplateName: string;
  setFollowUpTemplateName: (v: string) => void;
  followUpTemplateLanguageCode: string;
  setFollowUpTemplateLanguageCode: (v: string) => void;
  followUpTemplateVariables: string;
  setFollowUpTemplateVariables: (v: string) => void;
  disabled: boolean;
}

export default function FollowUpConfigCard({
  followUpEnabled,
  setFollowUpEnabled,
  followUpTemplateName,
  setFollowUpTemplateName,
  followUpTemplateLanguageCode,
  setFollowUpTemplateLanguageCode,
  followUpTemplateVariables,
  setFollowUpTemplateVariables,
  disabled,
}: FollowUpConfigCardProps) {
  return (
    <section className="glass-card p-8 rounded-card shadow-lg">
      <h2 className="text-lg font-bold text-textPrimary flex items-center gap-2 mb-6 border-b border-white/5 pb-4 bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
        <LockKeyhole size={18} className="text-primary" /> Policy-Safe Follow-ups
      </h2>

      <div className="space-y-6">
        <div className="flex items-center justify-between p-5 bg-white/[0.01] border border-white/5 rounded-2xl backdrop-blur-sm">
          <div>
            <p className="font-semibold text-sm text-textPrimary block mb-1">
              Enable template-based follow-up after 24 hours
            </p>
            <p className="text-xs text-textMuted">
              ReplySync will only send an approved WhatsApp template after the customer service window.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer select-none">
            <input
              type="checkbox"
              checked={followUpEnabled}
              disabled={disabled}
              onChange={(e) => setFollowUpEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-white/5 border border-white/5 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary shadow-glow-primary/10" />
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold text-textMuted mb-2">Template Name</label>
            <input
              type="text"
              value={followUpTemplateName}
              disabled={disabled}
              onChange={(e) => setFollowUpTemplateName(e.target.value)}
              placeholder="approved_follow_up_template"
              className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3 text-textPrimary focus:border-primary/40 focus:ring-1 focus:ring-primary/40 focus:outline-none disabled:opacity-60 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-textMuted mb-2">Language Code</label>
            <input
              type="text"
              value={followUpTemplateLanguageCode}
              disabled={disabled}
              onChange={(e) => setFollowUpTemplateLanguageCode(e.target.value)}
              placeholder="en_US"
              className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3 text-textPrimary focus:border-primary/40 focus:ring-1 focus:ring-primary/40 focus:outline-none disabled:opacity-60 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-textMuted mb-2">
            Template Variables
          </label>
          <input
            type="text"
            value={followUpTemplateVariables}
            disabled={disabled}
            onChange={(e) => setFollowUpTemplateVariables(e.target.value)}
            placeholder="Alice, Tuesday 4 PM"
            className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3 text-textPrimary focus:border-primary/40 focus:ring-1 focus:ring-primary/40 focus:outline-none disabled:opacity-60 transition-all"
          />
          <p className="text-xs text-textMuted mt-2">
            Provide comma-separated values matching your approved template body placeholders.
          </p>
        </div>
      </div>
    </section>
  );
}
