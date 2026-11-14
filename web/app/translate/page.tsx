"use client";
// A1: Sign to text and voice (offline), with multilingual output when online.
import { useState } from "react";
import SignToText from "@/components/SignToText";
import type { Lang } from "@/lib/model";
import { LANGS } from "@/lib/signs";

export default function TranslatePage() {
  const [lang, setLang] = useState<Lang>("psl");
  return (
    <main>
      <div className="row">
        <h1 style={{ flex: 1 }}>Translate</h1>
        <select value={lang} onChange={(e) => setLang(e.target.value as Lang)}>
          {LANGS.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </div>
      <SignToText lang={lang} showConfidence />
    </main>
  );
}
