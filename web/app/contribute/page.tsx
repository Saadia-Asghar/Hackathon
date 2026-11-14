"use client";
// C1: Contribute - record landmark clips (never video), consent required, offline queue.
import { useEffect, useState } from "react";
import { FEATURES, FRAMES } from "@/lib/features";
import type { Lang } from "@/lib/model";
import { LANGS, loadSigns, pretty, signVideo } from "@/lib/signs";
import { useSignCamera } from "@/lib/useSignCamera";

type Item = { lang: Lang; label: string; clip: number[][]; consent: true; at: string };
const KEY = "signbridge.contrib.queue";

function readQueue(): Item[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]") as Item[]; } catch { return []; }
}
function writeQueue(q: Item[]) {
  try { localStorage.setItem(KEY, JSON.stringify(q)); } catch { /* storage blocked */ }
}

export default function ContributePage() {
  const [lang, setLang] = useState<Lang>("psl");
  const [signs, setSigns] = useState<string[]>([]);
  const [label, setLabel] = useState("");
  const [consent, setConsent] = useState(false);
  const [queued, setQueued] = useState(0);
  const [msg, setMsg] = useState("");
  const cam = useSignCamera(lang, { predict: false });

  useEffect(() => { loadSigns(lang).then((s) => { setSigns(s); setLabel(s[0] ?? ""); }); }, [lang]);
  useEffect(() => { setQueued(readQueue().length); }, []);

  function record() {
    setMsg("Recording... perform the sign now");
    setTimeout(() => {
      const frames = cam.snapshot();
      if (frames.length < FRAMES) { setMsg("Not enough frames. Make sure your shoulders and hands are visible."); return; }
      const clip = frames.map((f) => Array.from(f));
      if (clip.some((f) => f.length !== FEATURES)) { setMsg("Bad clip shape"); return; }
      const q = [...readQueue(), { lang, label, clip, consent: true as const, at: new Date().toISOString() }];
      writeQueue(q);
      setQueued(q.length);
      setMsg(`Saved: ${pretty(label)}. Thank you!`);
    }, 1500);
  }

  async function upload() {
    const left: Item[] = [];
    for (const item of readQueue()) {
      try {
        const res = await fetch("/api/contribute", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(item) });
        if (!res.ok) left.push(item);
      } catch { left.push(item); }
    }
    writeQueue(left);
    setQueued(left.length);
    setMsg(left.length ? `${left.length} clips still waiting (offline or server error)` : "All clips uploaded");
  }

  return (
    <main>
      <div className="row">
        <h1 style={{ flex: 1 }}>Contribute signs</h1>
        <select value={lang} onChange={(e) => setLang(e.target.value as Lang)}>
          {LANGS.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </div>
      <p className="muted">We save only hand and body points (numbers), never your video.</p>
      <div className="row">
        <select value={label} onChange={(e) => setLabel(e.target.value)}>
          {signs.map((s) => <option key={s} value={s}>{pretty(s)}</option>)}
        </select>
        <label><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} /> I agree to share these points to improve SignBridge</label>
      </div>
      <div className="row" style={{ alignItems: "flex-start" }}>
        {label && <video key={label + lang} src={signVideo(lang, label)} autoPlay loop muted playsInline style={{ width: "48%", borderRadius: 12 }} />}
        <video ref={cam.videoRef} className="video" playsInline muted style={{ width: "48%" }} />
      </div>
      <p className="muted">{cam.status}</p>
      <div className="row">
        <button onClick={record} disabled={!consent || !label}>Record (1.5 s)</button>
        <button onClick={upload} disabled={!queued}>Upload {queued} saved</button>
      </div>
      {msg && <p>{msg}</p>}
    </main>
  );
}
