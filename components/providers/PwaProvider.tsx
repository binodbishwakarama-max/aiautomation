"use client";

import React, { useEffect } from "react";
import { PwaInstallBanner } from "@/components/ui/PwaInstallBanner";

export function PwaProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("PWA Service Worker registered safely.", registration.scope);
        })
        .catch((error) => {
          console.error("PWA Service Worker registration failed:", error);
        });
    }
  }, []);

  return (
    <>
      {children}
      <PwaInstallBanner />
    </>
  );
}
