"use client";
// A3: Conversation mode - deaf user signs (top), hearing user speaks (bottom).
import { useState } from "react";
import SignToText from "@/components/SignToText";
import SpeechToCaption from "@/components/SpeechToCaption";
import type { Lang } from "@/lib/model";
import { LANGS } from "@/lib/signs";

export default function ConversationPage() {
  const [lang, setLang] = useState<Lang>("psl");
  return (
    <main>
      <div className="row">
        <h1 style={{ flex: 1 }}>Conversation</h1>
        <select value={lang} onChange={(e) => setLang(e.target.value as Lang)}>
          {LANGS.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </div>
      <section style={{ borderBottom: "2px solid #334", paddingBottom: 16 }}>
        <h2>Deaf person signs</h2>
        <SignToText lang={lang} />
      </section>
      <section>
        <h2>Hearing person speaks</h2>
        <SpeechToCaption />
      </section>
    </main>
  );
}
