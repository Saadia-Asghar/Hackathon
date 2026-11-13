"use client";
import { useEffect, useRef, useState } from "react";
import { FRAMES, buildFrame } from "@/lib/features";
import { type Lang, SignModel, Stabilizer, type Prediction } from "@/lib/model";
import { glossToSentence, speak } from "@/lib/sentence";
import { createLandmarkers } from "@/lib/vision";

export default function TranslatePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [lang, setLang] = useState<Lang>("psl");
  const [status, setStatus] = useState("Loading...");
  const [pred, setPred] = useState<Prediction | null>(null);
  const [gloss, setGloss] = useState<string[]>([]);
  const [sentence, setSentence] = useState("");

  useEffect(() => {
    let stop = false;
    let stream: MediaStream | null = null;
    (async () => {
      try {
        const [{ hand, pose }, model] = await Promise.all([createLandmarkers(), SignModel.load(lang)]);
        stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
        const video = videoRef.current!;
        video.srcObject = stream;
        await video.play();
        setStatus("Ready: sign in front of the camera");

        const frames: Float32Array[] = [];
        const stab = new Stabilizer();
        let n = 0;
        let lastTs = -1;
        const loop = async () => {
          if (stop) return;
          const ts = performance.now();
          if (video.readyState >= 2 && ts > lastTs) {
            lastTs = ts;
            const f = buildFrame(hand.detectForVideo(video, ts), pose.detectForVideo(video, ts));
            if (f) {
              frames.push(f);
              if (frames.length > FRAMES) frames.shift();
              if (frames.length === FRAMES && ++n % 5 === 0) {
                const p = await model.predict(frames);
                setPred(p);
                const accepted = stab.push(p);
                if (accepted) setGloss((g) => [...g, accepted]);
              }
            } else setStatus("Step back so your shoulders are visible");
          }
          requestAnimationFrame(loop);
        };
        loop();
      } catch (e) {
        setStatus(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      stop = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [lang]);

  async function makeSentence() {
    const s = await glossToSentence(gloss);
    setSentence(s);
    speak(s);
  }

  return (
    <main>
      <div className="row">
        <h1 style={{ flex: 1 }}>Translate</h1>
        <select value={lang} onChange={(e) => { setGloss([]); setLang(e.target.value as Lang); }}>
          <option value="psl">Pakistan SL</option>
          <option value="sgsl">Singapore SL</option>
          <option value="asl">American SL</option>
        </select>
      </div>
      <p className="muted">{status}</p>
      <video ref={videoRef} className="video" playsInline muted />
      {pred && (
        <div>
          <p className="big">{pred.label.replace(/_/g, " ")}</p>
          <div className="bar"><div style={{ width: `${Math.round(pred.confidence * 100)}%` }} /></div>
        </div>
      )}
      <p className="big">{gloss.join(" ").replace(/_/g, " ") || "..."}</p>
      <div className="row">
        <button onClick={makeSentence} disabled={!gloss.length}>Make sentence and speak</button>
        <button onClick={() => { setGloss([]); setSentence(""); }}>Clear</button>
      </div>
      {sentence && <p className="big">{sentence}</p>}
    </main>
  );
}
