"use client";
// Reusable sign recognizer panel (used by /conversation and /kiosk).
import { useEffect, useState } from "react";
import { type Lang, Stabilizer } from "@/lib/model";
import { glossToSentence, speak } from "@/lib/sentence";
import { pretty } from "@/lib/signs";
import { useSignCamera } from "@/lib/useSignCamera";

export default function SignToText({ lang, big = false }: { lang: Lang; big?: boolean }) {
  const cam = useSignCamera(lang, { predict: true });
  const [stab] = useState(() => new Stabilizer());
  const [gloss, setGloss] = useState<string[]>([]);
  const [sentence, setSentence] = useState("");

  useEffect(() => {
    if (!cam.pred) return;
    const accepted = stab.push(cam.pred);
    if (accepted) setGloss((g) => [...g, accepted]);
  }, [cam.pred, stab]);

  async function done() {
    const s = await glossToSentence(gloss);
    setSentence(s);
    speak(s);
    setGloss([]);
  }

  return (
    <div>
      <video ref={cam.videoRef} className="video" playsInline muted style={{ maxHeight: big ? "55vh" : "35vh", objectFit: "cover" }} />
      <p className="muted">{cam.status}</p>
      <p className="big">{gloss.map(pretty).join(" ") || "..."}</p>
      <div className="row">
        <button onClick={done} disabled={!gloss.length}>Speak sentence</button>
        <button onClick={() => { setGloss([]); setSentence(""); }}>Clear</button>
      </div>
      {sentence && <p className="big" style={{ color: "var(--accent)" }}>{sentence}</p>}
    </div>
  );
}
