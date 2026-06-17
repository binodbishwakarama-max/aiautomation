"use client";

import Script from "next/script";

interface FBWindow {
  FB?: {
    init: (config: { appId?: string; cookie?: boolean; xfbml?: boolean; version?: string }) => void;
  };
}

export default function FacebookSDKLoader() {
  const appId = process.env.NEXT_PUBLIC_META_APP_ID;

  if (!appId) {
    return null;
  }

  return (
    <Script
      src="https://connect.facebook.net/en_US/sdk.js"
      strategy="afterInteractive"
      onLoad={() => {
        try {
          const fb = (window as unknown as FBWindow).FB;
          if (fb) {
            fb.init({
              appId: appId,
              cookie: true,
              xfbml: true,
              version: "v19.0",
            });
          }
        } catch (e) {
          console.error("Failed to initialize Meta Facebook SDK:", e);
        }
      }}
    />
  );
}
