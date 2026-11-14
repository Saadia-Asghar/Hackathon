"use client";
// C2: Validate - replay contributed landmark clips as a skeleton, approve or reject.
// Local version (this device). Later: load from Azure Blob for verified deaf validators.
import { useEffect, useRef, useState } from "react";
import { FEATURES, HAND_POINTS } from "@/lib/features";
import { pretty } from "@/lib/signs";

type Item = { lang: string; label: string; clip: number[][]; consent: true; at: string; status?: "approved" };
const KEY = "signbridge.contrib.queue";

function readQueue(): Item[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]") as Item[]; } catch { return []; }
}
function writeQueue(q: Item[]) {
  try { localStorage.setItem(KEY, JSON.stringify(q)); } catch { /* storage blocked */ }
}

// MediaPipe hand connections (21 points) and upper-body pose connections.
const HAND_EDGES = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]];
const POSE_EDGES = [[11,12],[11,13],[13,15],[12,14],[14,16]];

function drawFrame(ctx: CanvasRenderingContext2D, f: number[]) {
  const W = ctx.canvas.width, H = ctx.canvas.height;
  // features are centred on the shoulders and scaled by shoulder width; mirror x for a selfie view
  const pt = (i: number) => [W / 2 - f[i * 3] * W * 0.18, H * 0.45 + f[i * 3 + 1] * W * 0.18] as const;
  ctx.fillStyle = "#0b1220";
  ctx.fillRect(0, 0, W, H);
  ctx.lineWidth = 3;
  const line = (a: number, b: number, color: string) => {
    const [x1, y1] = pt(a);
    const [x2, y2] = pt(b);
    ctx.strokeStyle = color;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  };
  const poseBase = HAND_POINTS * 2;
  POSE_EDGES.forEach(([a, b]) => line(poseBase + a, poseBase + b, "#8a96ab"));
  [0, HAND_POINTS].forEach((base, h) => {
    const present = f.slice(base * 3, (base + HAND_POINTS) * 3).some((v) => v !== 0);
    if (present) HAND_EDGES.forEach(([a, b]) => line(base + a, base + b, h === 0 ? "#3dd6f5" : "#f5a83d"));
  });
}

export default function ValidatePage() {
  const [queue, setQueue] = useState<Item[]>([]);
  const [idx, setIdx] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pending = queue.map((it, i) => ({ it, i })).filter(({ it }) => it.status !== "approved");
  const current = pending[idx];

  useEffect(() => { setQueue(readQueue()); }, []);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !current) return;
    const clip = current.it.clip.filter((f) => f.length === FEATURES);
    if (!clip.length) return;
    let frame = 0;
    const timer = setInterval(() => { drawFrame(ctx, clip[frame % clip.length]); frame++; }, 66);
    return () => clearInterval(timer);
  }, [current]);

  function decide(approve: boolean) {
    if (!current) return;
    const q = [...queue];
    if (approve) q[current.i] = { ...q[current.i], status: "approved" };
    else q.splice(current.i, 1);
    writeQueue(q);
    setQueue(q);
    setIdx(0);
  }

  return (
    <main>
      <h1>Validate signs</h1>
      <p className="muted">Deaf validators check each recording. Approved clips are used to train better models.</p>
      <p>{pending.length} waiting | {queue.length - pending.length} approved</p>
      {current ? (
        <>
          <p className="big">{pretty(current.it.label)} <span className="muted">({current.it.lang})</span></p>
          <canvas ref={canvasRef} width={480} height={360} style={{ width: "100%", maxWidth: 480, borderRadius: 12 }} />
          <div className="row">
            <button onClick={() => decide(true)} style={{ background: "#145c32" }}>Approve</button>
            <button onClick={() => decide(false)} style={{ background: "#7a0016" }}>Reject</button>
            <button onClick={() => setIdx((n) => (n + 1) % pending.length)}>Skip</button>
          </div>
        </>
      ) : (
        <p>Nothing to review. Record some signs on the Contribute page.</p>
      )}
    </main>
  );
}
