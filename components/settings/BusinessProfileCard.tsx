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
    <section className="bg-surface border border-border p-6 rounded-card">
      <h2 className="text-lg font-bold text-textPrimary flex items-center gap-2 mb-6">
        <Building2 size={18} className="text-primary" /> Business Profile
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-textMuted mb-2">Business Name</label>
          <input
            type="text"
            value={name}
            disabled={disabled}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-textPrimary focus:border-primary focus:outline-none disabled:opacity-60"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-textMuted mb-2">Business Type</label>
          <select
            value={businessType}
            disabled={disabled}
            onChange={(e) => setBusinessType(e.target.value)}
            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-textPrimary focus:border-primary focus:outline-none disabled:opacity-60"
          >
            <option value="coaching_institute">Coaching / Institute</option>
            <option value="tuition_center">Tuition Center</option>
            <option value="e_learning">E-Learning</option>
            <option value="consultancy">Consultancy</option>
            <option value="freelance">Freelancer</option>
            <option value="ecommerce">E-Commerce</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-textMuted mb-2">Public Contact Number</label>
          <input
            type="text"
            value={phoneNumber}
            disabled={disabled}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+1 234 567 890"
            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-textPrimary focus:border-primary focus:outline-none font-mono disabled:opacity-60"
          />
        </div>
      </div>
    </section>
  );
}
