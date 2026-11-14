"use client";
// Sign recognizer panel with multilingual voice output.
// Used by /translate, /conversation and /kiosk.
import { useEffect, useState } from "react";
import { type Lang, Stabilizer } from "@/lib/model";
import { OUTPUT_LANGS, glossToSentence, speakIn, translateText } from "@/lib/sentence";
import { pretty } from "@/lib/signs";
import { logUsage } from "@/lib/usage";
import { useSignCamera } from "@/lib/useSignCamera";

export default function SignToText({ lang, big = false, showConfidence = false }: { lang: Lang; big?: boolean; showConfidence?: boolean }) {
  const cam = useSignCamera(lang, { predict: true });
  const [stab] = useState(() => new Stabilizer());
  const [gloss, setGloss] = useState<string[]>([]);
  const [sentence, setSentence] = useState("");
  const [outCode, setOutCode] = useState("en");
  const out = OUTPUT_LANGS.find((o) => o.code === outCode) ?? OUTPUT_LANGS[0];

  useEffect(() => { setGloss([]); setSentence(""); }, [lang]);

  useEffect(() => {
    if (!cam.pred) return;
    const accepted = stab.push(cam.pred);
    if (accepted) setGloss((g) => [...g, accepted]);
  }, [cam.pred, stab]);

  async function done() {
    const english = await glossToSentence(gloss);
    const text = await translateText(english, out.code);
    setSentence(text);
    logUsage("sentence", lang);
    await speakIn(text, out);
    setGloss([]);
  }

  return (
    <div>
      <video ref={cam.videoRef} className="video" playsInline muted style={{ maxHeight: big ? "55vh" : "40vh", objectFit: "cover" }} />
      <p className="muted">{cam.status}</p>
      {showConfidence && cam.pred && (
        <div>
          <p>{pretty(cam.pred.label)} ({Math.round(cam.pred.confidence * 100)}%)</p>
          <div className="bar"><div style={{ width: `${Math.round(cam.pred.confidence * 100)}%` }} /></div>
        </div>
      )}
      <p className="big">{gloss.map(pretty).join(" ") || "..."}</p>
      <div className="row">
        <button onClick={done} disabled={!gloss.length}>Speak sentence</button>
        <button onClick={() => { setGloss([]); setSentence(""); }}>Clear</button>
        <button onClick={() => setGloss((g) => g.slice(0, -1))} disabled={!gloss.length}>Undo</button>
        <label className="muted">Voice:{" "}
          <select value={outCode} onChange={(e) => setOutCode(e.target.value)}>
            {OUTPUT_LANGS.map((o) => <option key={o.code} value={o.code}>{o.name}</option>)}
          </select>
        </label>
      </div>
      {sentence && (
        <div className="row">
          <p className="big" style={{ color: "var(--accent)", flex: 1 }}>{sentence}</p>
          <button onClick={() => speakIn(sentence, out)}>Repeat</button>
        </div>
      )}
    </div>
  );
}
