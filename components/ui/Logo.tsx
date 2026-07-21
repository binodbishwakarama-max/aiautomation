"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
  size?: "sm" | "md" | "lg";
}

export function Logo({ className, iconOnly = false, size = "md" }: LogoProps) {
  const iconSizes = {
    sm: "w-7 h-7",
    md: "w-9 h-9",
    lg: "w-11 h-11",
  };

  const textSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-xl",
  };

  return (
    <div className={cn("inline-flex items-center gap-2.5 select-none shrink-0", className)}>
      {/* High-Resolution Pentagram Möbius Sync Node App Icon */}
      <div className={cn("relative overflow-hidden rounded-xl border border-white/10 shadow-lg shrink-0 group-hover:scale-105 transition-transform duration-200", iconSizes[size])}>
        <Image 
          src="/logo.png" 
          alt="ReplySync Logo" 
          width={44} 
          height={44}
          className="w-full h-full object-cover"
          priority
        />
      </div>

      {!iconOnly && (
        <span className={cn("font-bold tracking-tight text-textPrimary font-sans flex items-center leading-none", textSizes[size])}>
          Reply<span className="text-accent ml-0.5">Sync</span>
        </span>
      )}
    </div>
  );
}
