"use client";

import React from "react";
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
      {/* 100% Reliable Pentagram-Grade Inline Vector Brand Mark */}
      <div className={cn("relative overflow-hidden shrink-0 transition-transform duration-150 hover:scale-105", iconSizes[size])}>
        <svg 
          viewBox="0 0 32 32" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Dark Squircle Background */}
          <rect 
            x="1.5" 
            y="1.5" 
            width="29" 
            height="29" 
            rx="8" 
            fill="#131F24" 
            stroke="rgba(255, 255, 255, 0.12)" 
            strokeWidth="1" 
          />

          {/* Left Dispatch Green Signal Loop */}
          <circle 
            cx="12" 
            cy="16" 
            r="5" 
            stroke="#00E599" 
            strokeWidth="2.2" 
            fill="none" 
          />

          {/* Right Signal Cyan Loop */}
          <circle 
            cx="20" 
            cy="16" 
            r="5" 
            stroke="#06B6D4" 
            strokeWidth="2.2" 
            fill="none" 
          />

          {/* Central Synchronization Core */}
          <circle 
            cx="16" 
            cy="16" 
            r="1.8" 
            fill="#00E599" 
          />
        </svg>
      </div>

      {!iconOnly && (
        <span className={cn("font-bold tracking-tight text-textPrimary font-sans flex items-center leading-none", textSizes[size])}>
          Reply<span className="text-accent ml-0.5">Sync</span>
        </span>
      )}
    </div>
  );
}
