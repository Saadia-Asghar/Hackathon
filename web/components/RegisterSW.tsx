"use client";
// Registers the offline service worker (production builds only, so dev hot-reload is not cached).
import { useEffect } from "react";

export default function RegisterSW() {
  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
  }, []);
  return null;
}
