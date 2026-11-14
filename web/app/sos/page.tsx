"use client";
// C3: SOS - works 100% offline.
import { useState } from "react";
import { speak } from "@/lib/sentence";
import { logUsage } from "@/lib/usage";

const PHRASES = [
  "I am deaf. Please write or type to me.",
  "I need a doctor.",
  "Please call the police.",
  "I am lost. Please help me.",
  "Please call my family.",
  "I am in pain.",
];

export default function SosPage() {
  const [shown, setShown] = useState<string | null>(null);
  const [loc, setLoc] = useState("");

  function show(p: string) { setShown(p); speak(p); logUsage("sos"); }
  function shareLocation() {
    if (!navigator.geolocation) { setLoc("Location not available"); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => setLoc(`My location: ${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`),
      () => setLoc("Location permission denied"),
    );
  }

  if (shown) {
    return (
      <main onClick={() => setShown(null)} style={{ minHeight: "100vh", background: "#b00020", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <p style={{ fontSize: "3rem", fontWeight: 800, textAlign: "center" }}>{shown}</p>
        {loc && <p style={{ fontSize: "1.5rem", textAlign: "center" }}>{loc}</p>}
        <div className="row" style={{ justifyContent: "center" }}>
          <button onClick={(e) => { e.stopPropagation(); speak(shown); }}>Repeat aloud</button>
          <button onClick={(e) => { e.stopPropagation(); shareLocation(); }}>Show my location</button>
        </div>
        <p style={{ textAlign: "center" }}>Tap anywhere to go back</p>
      </main>
    );
  }
  return (
    <main>
      <h1>SOS</h1>
      <div style={{ display: "grid", gap: 12 }}>
        {PHRASES.map((p) => (
          <button key={p} onClick={() => show(p)} style={{ fontSize: "1.4rem", padding: 20, background: "#7a0016" }}>{p}</button>
        ))}
      </div>
    </main>
  );
}
