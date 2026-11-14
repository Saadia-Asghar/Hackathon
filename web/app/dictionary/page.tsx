"use client";
// B2: Dictionary - search a word, watch the sign.
import { useEffect, useState } from "react";
import type { Lang } from "@/lib/model";
import { LANGS, loadSigns, pretty, signVideo } from "@/lib/signs";

export default function DictionaryPage() {
  const [lang, setLang] = useState<Lang>("psl");
  const [signs, setSigns] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  useEffect(() => { loadSigns(lang).then(setSigns); }, [lang]);
  const shown = signs.filter((s) => pretty(s).includes(q.toLowerCase().trim()));

  return (
    <main>
      <div className="row">
        <h1 style={{ flex: 1 }}>Dictionary</h1>
        <select value={lang} onChange={(e) => setLang(e.target.value as Lang)}>
          {LANGS.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </div>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a word"
        style={{ width: "100%", padding: 12, fontSize: "1.1rem", borderRadius: 10 }} />
      <div className="row" style={{ marginTop: 12 }}>
        {shown.map((s) => <button key={s} onClick={() => setOpen(s)}>{pretty(s)}</button>)}
      </div>
      {open && (
        <div style={{ marginTop: 16 }}>
          <p className="big">{pretty(open)}</p>
          <video key={open + lang} src={signVideo(lang, open)} autoPlay loop muted playsInline controls style={{ width: "100%", borderRadius: 16 }} />
        </div>
      )}
    </main>
  );
}
