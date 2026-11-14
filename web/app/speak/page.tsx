"use client";
// A2: Voice/Text to Sign videos (fingerspell unknown words).
import { useEffect, useState } from "react";
import type { Lang } from "@/lib/model";
import { LANGS, letterVideo, loadSigns, pretty, signVideo } from "@/lib/signs";

type Clip = { src: string; caption: string };

interface SpeechRecognitionLike {
  lang: string;
  onresult: (e: { results: { [i: number]: { [j: number]: { transcript: string } } } }) => void;
  start: () => void;
}
type SRWindow = { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike };

export default function SpeakPage() {
  const [lang, setLang] = useState<Lang>("psl");
  const [signs, setSigns] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [queue, setQueue] = useState<Clip[]>([]);
  const [i, setI] = useState(0);
  const [missing, setMissing] = useState(false);

  useEffect(() => { loadSigns(lang).then(setSigns); }, [lang]);

  function play() {
    const clips: Clip[] = [];
    for (const raw of text.toLowerCase().split(/\s+/).filter(Boolean)) {
      const word = raw.replace(/[^a-z]/g, "");
      if (!word) continue;
      if (signs.includes(word)) clips.push({ src: signVideo(lang, word), caption: word });
      else for (const ch of word) clips.push({ src: letterVideo(lang, ch), caption: `${word} (${ch.toUpperCase()})` });
    }
    setQueue(clips); setI(0); setMissing(false);
  }

  function listen() {
    const w = window as unknown as SRWindow;
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) { alert("Speech input is not supported in this browser. Please type."); return; }
    const r = new Ctor();
    r.lang = "en-US";
    r.onresult = (e) => setText(e.results[0][0].transcript);
    r.start();
  }

  const clip = queue[i];
  return (
    <main>
      <div className="row">
        <h1 style={{ flex: 1 }}>Speak</h1>
        <select value={lang} onChange={(e) => setLang(e.target.value as Lang)}>
          {LANGS.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </div>
      <div className="row">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type or press Mic"
          style={{ flex: 1, padding: 12, fontSize: "1.1rem", borderRadius: 10 }} />
        <button onClick={listen}>Mic</button>
        <button onClick={play} disabled={!text.trim()}>Sign it</button>
      </div>
      {clip && (
        <div>
          <video key={clip.src + i} src={clip.src} autoPlay muted playsInline style={{ width: "100%", borderRadius: 16 }}
            onEnded={() => setI((n) => n + 1)} onError={() => { setMissing(true); setI((n) => n + 1); }} />
          <p className="big">{pretty(clip.caption)}</p>
        </div>
      )}
      {missing && <p className="muted">Some sign videos are missing. Add them to public/signs/{lang}/</p>}
    </main>
  );
}
