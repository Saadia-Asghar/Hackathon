"use client";
// B1: SignLearn - watch, perform, get scored by the model. Progress in localStorage.
import { useEffect, useState } from "react";
import type { Lang } from "@/lib/model";
import { LANGS, loadSigns, pretty, signVideo } from "@/lib/signs";
import { useSignCamera } from "@/lib/useSignCamera";

type Progress = { xp: number; streak: number; lastDay: string };
const KEY = "signbridge.progress";
const EMPTY: Progress = { xp: 0, streak: 0, lastDay: "" };

function readProgress(): Progress {
  try { return (JSON.parse(localStorage.getItem(KEY) ?? "null") as Progress | null) ?? EMPTY; } catch { return EMPTY; }
}

export default function LearnPage() {
  const [lang, setLang] = useState<Lang>("psl");
  const [signs, setSigns] = useState<string[]>([]);
  const [lesson, setLesson] = useState(0);
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState<Progress>(EMPTY);
  const [feedback, setFeedback] = useState("");
  const cam = useSignCamera(lang, { predict: true });

  useEffect(() => { setProgress(readProgress()); }, []);
  useEffect(() => { loadSigns(lang).then(setSigns); setLesson(0); setStep(0); }, [lang]);

  const lessons = Array.from({ length: Math.ceil(signs.length / 5) }, (_, k) => signs.slice(k * 5, k * 5 + 5));
  const target = lessons[lesson]?.[step];

  useEffect(() => {
    if (!target || !cam.pred) return;
    if (cam.pred.label !== target || cam.pred.confidence < 0.6) return;
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const p = readProgress();
    const next: Progress = {
      xp: p.xp + 10,
      streak: p.lastDay === today ? p.streak : p.lastDay === yesterday ? p.streak + 1 : 1,
      lastDay: today,
    };
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* storage blocked */ }
    setProgress(next);
    setFeedback(`Correct: ${pretty(target)} +10 XP`);
    setStep((s) => s + 1);
  }, [cam.pred, target]);

  return (
    <main>
      <div className="row">
        <h1 style={{ flex: 1 }}>Learn</h1>
        <span>XP {progress.xp} | Level {Math.floor(progress.xp / 100) + 1} | Streak {progress.streak}</span>
        <select value={lang} onChange={(e) => setLang(e.target.value as Lang)}>
          {LANGS.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </div>
      <div className="row">
        {lessons.map((_, k) => (
          <button key={k} onClick={() => { setLesson(k); setStep(0); setFeedback(""); }} style={{ opacity: k === lesson ? 1 : 0.6 }}>
            Lesson {k + 1}
          </button>
        ))}
      </div>
      {target ? (
        <>
          <p className="big">Sign: {pretty(target)}</p>
          <div className="row" style={{ alignItems: "flex-start" }}>
            <video key={target + lang} src={signVideo(lang, target)} autoPlay loop muted playsInline style={{ width: "48%", borderRadius: 12 }} />
            <video ref={cam.videoRef} className="video" playsInline muted style={{ width: "48%" }} />
          </div>
          <p className="muted">{cam.status}{cam.pred ? ` | seeing: ${pretty(cam.pred.label)} ${Math.round(cam.pred.confidence * 100)}%` : ""}</p>
          <button onClick={() => setStep((s) => s + 1)}>Skip</button>
        </>
      ) : (
        <p className="big">Lesson complete!</p>
      )}
      {feedback && <p>{feedback}</p>}
    </main>
  );
}
