"use client";
// Hearing person speaks or types; shows big captions for the deaf person.
import { useState } from "react";

interface SR {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
  start: () => void;
  stop: () => void;
}
type SRWindow = { SpeechRecognition?: new () => SR; webkitSpeechRecognition?: new () => SR };

export default function SpeechToCaption() {
  const [text, setText] = useState("");
  const [typed, setTyped] = useState("");
  const [rec, setRec] = useState<SR | null>(null);

  function toggle() {
    if (rec) { rec.stop(); setRec(null); return; }
    const w = window as unknown as SRWindow;
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) { alert("Speech input not supported here. Please type."); return; }
    const r = new Ctor();
    r.lang = "en-US";
    r.continuous = true;
    r.interimResults = true;
    r.onresult = (e) => setText(Array.from(e.results).map((x) => x[0].transcript).join(" "));
    r.start();
    setRec(r);
  }

  return (
    <div>
      <p style={{ fontSize: "2.4rem", fontWeight: 700, minHeight: "3em" }}>{text || "Captions appear here"}</p>
      <div className="row">
        <button onClick={toggle}>{rec ? "Stop mic" : "Start mic"}</button>
        <input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="Or type here"
          onKeyDown={(e) => { if (e.key === "Enter") { setText(typed); setTyped(""); } }}
          style={{ flex: 1, padding: 12, fontSize: "1.1rem", borderRadius: 10 }} />
      </div>
    </div>
  );
}
