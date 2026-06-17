"use client";

import Script from "next/script";

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
          // @ts-ignore
          if (window.FB) {
            // @ts-ignore
            window.FB.init({
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
