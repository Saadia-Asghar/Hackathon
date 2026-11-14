"use client";
// Shared camera + recognition hook used by learn and contribute pages.
import { useEffect, useRef, useState } from "react";
import { FRAMES, buildFrame } from "./features";
import { type Lang, type Prediction, SignModel } from "./model";
import { createLandmarkers } from "./vision";

export function useSignCamera(lang: Lang, opts: { predict: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const framesRef = useRef<Float32Array[]>([]);
  const [status, setStatus] = useState("Loading...");
  const [pred, setPred] = useState<Prediction | null>(null);
  const predict = opts.predict;

  useEffect(() => {
    let stop = false;
    let stream: MediaStream | null = null;
    (async () => {
      try {
        const lm = await createLandmarkers();
        const model = predict ? await SignModel.load(lang).catch(() => null) : null;
        if (predict && !model) setStatus(`No ${lang} model yet. Train it with ml/train.py`);
        stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
        const video = videoRef.current!;
        video.srcObject = stream;
        await video.play();
        if (!predict || model) setStatus("Ready");
        let n = 0;
        let lastTs = -1;
        const loop = async () => {
          if (stop) return;
          const ts = performance.now();
          if (video.readyState >= 2 && ts > lastTs) {
            lastTs = ts;
            const f = buildFrame(lm.hand.detectForVideo(video, ts), lm.pose.detectForVideo(video, ts));
            if (f) {
              const frames = framesRef.current;
              frames.push(f);
              if (frames.length > FRAMES) frames.shift();
              if (model && frames.length === FRAMES && ++n % 5 === 0) setPred(await model.predict(frames));
            }
          }
          requestAnimationFrame(loop);
        };
        loop();
      } catch (e) {
        setStatus(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => { stop = true; stream?.getTracks().forEach((t) => t.stop()); };
  }, [lang, predict]);

  /** Latest 30 frames (fewer if the camera just started). */
  const snapshot = () => framesRef.current.slice(-FRAMES);
  return { videoRef, status, pred, snapshot };
}
