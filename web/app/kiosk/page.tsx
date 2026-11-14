"use client";
// D1: Kiosk - full-screen counter mode, resets after 60 s idle. Use /kiosk?org=Bank%20Name&lang=sgsl
import { useEffect, useState } from "react";
import SignToText from "@/components/SignToText";
import SpeechToCaption from "@/components/SpeechToCaption";
import type { Lang } from "@/lib/model";

const IDLE_MS = 60_000;
const EVENTS = ["pointerdown", "keydown"] as const;

export default function KioskPage() {
  const [session, setSession] = useState(0);
  const [org, setOrg] = useState("Welcome");
  const [lang, setLang] = useState<Lang>("psl");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const name = params.get("org");
    const l = params.get("lang");
    if (name) setOrg(name);
    if (l === "psl" || l === "sgsl" || l === "asl") setLang(l);
    let t = setTimeout(() => setSession((s) => s + 1), IDLE_MS);
    const reset = () => { clearTimeout(t); t = setTimeout(() => setSession((s) => s + 1), IDLE_MS); };
    EVENTS.forEach((ev) => window.addEventListener(ev, reset));
    return () => { clearTimeout(t); EVENTS.forEach((ev) => window.removeEventListener(ev, reset)); };
  }, []);

  return (
    <main key={session} style={{ maxWidth: "100%" }}>
      <div className="row">
        <h1 style={{ flex: 1 }}>{org}: Sign language help</h1>
        <button onClick={() => document.documentElement.requestFullscreen?.()}>Full screen</button>
      </div>
      <div style={{ display: "grid", gap: 24, gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
        <section><h2>Customer signs</h2><SignToText lang={lang} big /></section>
        <section><h2>Staff speaks</h2><SpeechToCaption /></section>
      </div>
    </main>
  );
}
