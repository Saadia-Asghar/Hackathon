"use client";
// C4: Document to plain language and sign. Needs internet (Azure AI Vision + Azure OpenAI).
import Link from "next/link";
import { useState } from "react";
import { OUTPUT_LANGS, speakIn, translateText } from "@/lib/sentence";
import { logUsage } from "@/lib/usage";

export default function DocumentPage() {
  const [status, setStatus] = useState("");
  const [result, setResult] = useState<{ text: string; simple: string } | null>(null);
  const [outCode, setOutCode] = useState("en");
  const [shown, setShown] = useState("");
  const out = OUTPUT_LANGS.find((o) => o.code === outCode) ?? OUTPUT_LANGS[0];

  async function onFile(file: File | undefined) {
    if (!file) return;
    if (!navigator.onLine) { setStatus("This feature needs internet."); return; }
    setStatus("Reading document...");
    setResult(null);
    try {
      const res = await fetch("/api/ocr", { method: "POST", headers: { "Content-Type": "application/octet-stream" }, body: file });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = (await res.json()) as { text: string; simple: string };
      setResult(data);
      setShown(await translateText(data.simple, outCode));
      logUsage("document");
      setStatus(data.text ? "" : "No text found in the image.");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : String(e));
    }
  }

  async function changeLang(code: string) {
    setOutCode(code);
    if (result) setShown(await translateText(result.simple, code));
  }

  return (
    <main>
      <h1>Read a document</h1>
      <p className="muted">Take a photo of a letter or form. We explain it in simple words, read it aloud, and sign it.</p>
      <div className="row">
        <input type="file" accept="image/*" capture="environment" onChange={(e) => onFile(e.target.files?.[0])} />
        <select value={outCode} onChange={(e) => changeLang(e.target.value)}>
          {OUTPUT_LANGS.map((o) => <option key={o.code} value={o.code}>{o.name}</option>)}
        </select>
      </div>
      {status && <p className="muted">{status}</p>}
      {result && result.simple && (
        <>
          <h2>In simple words</h2>
          <p className="big" style={{ fontSize: "1.5rem" }}>{shown || result.simple}</p>
          <div className="row">
            <button onClick={() => speakIn(shown || result.simple, out)}>Read aloud</button>
            <Link href={`/speak?text=${encodeURIComponent(result.simple)}`}>Show in sign</Link>
          </div>
          <details><summary>Original text</summary><pre style={{ whiteSpace: "pre-wrap" }}>{result.text}</pre></details>
        </>
      )}
    </main>
  );
}
