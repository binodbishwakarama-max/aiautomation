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
    <section className="bg-surface border border-border p-6 rounded-card">
      <h2 className="text-lg font-bold text-textPrimary flex items-center gap-2 mb-6">
        <LockKeyhole size={18} className="text-primary" /> Policy-Safe Follow-ups
      </h2>

      <div className="space-y-6">
        <div className="flex items-center justify-between p-4 bg-background border border-border rounded-xl">
          <div>
            <p className="font-semibold text-sm text-textPrimary block mb-1">
              Enable template-based follow-up after 24 hours
            </p>
            <p className="text-xs text-textMuted">
              ReplySync will only send an approved WhatsApp template after the customer service window.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={followUpEnabled}
              disabled={disabled}
              onChange={(e) => setFollowUpEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary shadow-glow-primary/10" />
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-textMuted mb-2">Template Name</label>
            <input
              type="text"
              value={followUpTemplateName}
              disabled={disabled}
              onChange={(e) => setFollowUpTemplateName(e.target.value)}
              placeholder="approved_follow_up_template"
              className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-textPrimary focus:border-secondary focus:outline-none disabled:opacity-60"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-textMuted mb-2">Language Code</label>
            <input
              type="text"
              value={followUpTemplateLanguageCode}
              disabled={disabled}
              onChange={(e) => setFollowUpTemplateLanguageCode(e.target.value)}
              placeholder="en_US"
              className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-textPrimary focus:border-secondary focus:outline-none disabled:opacity-60"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-textMuted mb-2">
            Template Variables
          </label>
          <input
            type="text"
            value={followUpTemplateVariables}
            disabled={disabled}
            onChange={(e) => setFollowUpTemplateVariables(e.target.value)}
            placeholder="Alice, Tuesday 4 PM"
            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-textPrimary focus:border-secondary focus:outline-none disabled:opacity-60"
          />
          <p className="text-xs text-textMuted mt-2">
            Provide comma-separated values matching your approved template body placeholders.
          </p>
        </div>
      </div>
    </section>
  );
}
