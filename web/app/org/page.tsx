"use client";
// D2: Organisation dashboard (this device). Later: aggregate all devices via Cosmos DB.
import { useEffect, useState } from "react";
import { type UsageEvent, readUsage } from "@/lib/usage";

type Progress = { xp: number; streak: number; lastDay: string };

export default function OrgPage() {
  const [usage, setUsage] = useState<UsageEvent[]>([]);
  const [progress, setProgress] = useState<Progress | null>(null);

  useEffect(() => {
    setUsage(readUsage());
    try { setProgress(JSON.parse(localStorage.getItem("signbridge.progress") ?? "null") as Progress | null); } catch { setProgress(null); }
  }, []);

  const count = (k: "type" | "lang", v: string) => usage.filter((u) => u[k] === v).length;
  const days = Array.from({ length: 7 }, (_, i) => new Date(Date.now() - (6 - i) * 86400000).toISOString().slice(0, 10));
  const perDay = days.map((d) => usage.filter((u) => u.at.startsWith(d)).length);
  const max = Math.max(1, ...perDay);

  function exportCsv() {
    const rows = ["type,lang,at", ...usage.map((u) => `${u.type},${u.lang},${u.at}`)].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([rows], { type: "text/csv" }));
    a.download = "signbridge-usage.csv";
    a.click();
  }

  const tiles: [string, number][] = [
    ["Conversations", count("type", "sentence")],
    ["Documents read", count("type", "document")],
    ["SOS used", count("type", "sos")],
    ["Staff XP", progress?.xp ?? 0],
  ];

  return (
    <main>
      <div className="row">
        <h1 style={{ flex: 1 }}>Organisation dashboard</h1>
        <button onClick={exportCsv}>Export CSV</button>
        <button onClick={() => window.print()}>Compliance report (PDF)</button>
      </div>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
        {tiles.map(([name, v]) => (
          <div key={name} style={{ padding: 16, borderRadius: 12, background: "#18233a" }}>
            <div className="muted">{name}</div>
            <div className="big">{v}</div>
          </div>
        ))}
      </div>
      <h2>Last 7 days</h2>
      <div className="row" style={{ alignItems: "flex-end", height: 140, gap: 6 }}>
        {perDay.map((n, i) => (
          <div key={days[i]} style={{ flex: 1, textAlign: "center" }}>
            <div style={{ height: (n / max) * 110, background: "var(--accent)", borderRadius: 4 }} title={String(n)} />
            <div className="muted" style={{ fontSize: 12 }}>{days[i].slice(5)}</div>
          </div>
        ))}
      </div>
      <h2>Sign languages used</h2>
      <ul>
        <li>Pakistan SL: {count("lang", "psl")}</li>
        <li>Singapore SL: {count("lang", "sgsl")}</li>
        <li>American SL: {count("lang", "asl")}</li>
      </ul>
    </main>
  );
}
