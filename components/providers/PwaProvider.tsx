"use client";

import React, { useEffect } from "react";
import { PwaInstallBanner } from "@/components/ui/PwaInstallBanner";

export function PwaProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // next-pwa automatically handles service worker registration
    // We keep this provider for the custom PWA installation banner
  }, []);

  return (
    <>
      {children}
      <PwaInstallBanner />
    </>
  );
}
