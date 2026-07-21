"use client";

import { Building2 } from "lucide-react";

interface BusinessProfileCardProps {
  name: string;
  setName: (v: string) => void;
  businessType: string;
  setBusinessType: (v: string) => void;
  phoneNumber: string;
  setPhoneNumber: (v: string) => void;
  disabled: boolean;
}

export default function BusinessProfileCard({
  name,
  setName,
  businessType,
  setBusinessType,
  phoneNumber,
  setPhoneNumber,
  disabled,
}: BusinessProfileCardProps) {
  return (
    <section className="glass-card p-4 sm:p-8 rounded-card shadow-lg">
      <h2 className="text-base sm:text-lg font-bold text-textPrimary flex items-center gap-2 mb-6 border-b border-white/5 pb-4 bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
        <Building2 size={18} className="text-primary shrink-0" /> Business Profile
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-xs font-semibold text-textMuted mb-2">Business Name</label>
          <input
            type="text"
            value={name}
            disabled={disabled}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3 text-base sm:text-sm text-textPrimary focus:border-primary/40 focus:ring-1 focus:ring-primary/40 focus:outline-none disabled:opacity-60 transition-all"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-textMuted mb-2">Business Type</label>
          <select
            value={businessType}
            disabled={disabled}
            onChange={(e) => setBusinessType(e.target.value)}
            className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3 text-base sm:text-sm text-textPrimary focus:border-primary/40 focus:ring-1 focus:ring-primary/40 focus:outline-none disabled:opacity-60 transition-all select-none"
          >
            <option value="coaching_institute" className="bg-surface text-textPrimary">Coaching / Institute</option>
            <option value="tuition_center" className="bg-surface text-textPrimary">Tuition Center</option>
            <option value="e_learning" className="bg-surface text-textPrimary">E-Learning</option>
            <option value="consultancy" className="bg-surface text-textPrimary">Consultancy</option>
            <option value="freelance" className="bg-surface text-textPrimary">Freelancer</option>
            <option value="ecommerce" className="bg-surface text-textPrimary">E-Commerce</option>
            <option value="other" className="bg-surface text-textPrimary">Other</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-textMuted mb-2">Public Contact Number</label>
          <input
            type="text"
            value={phoneNumber}
            disabled={disabled}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+1 234 567 890"
            className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3 text-base sm:text-sm text-textPrimary focus:border-primary/40 focus:ring-1 focus:ring-primary/40 focus:outline-none font-mono disabled:opacity-60 transition-all"
          />
        </div>
      </div>
    </section>
  );
}
