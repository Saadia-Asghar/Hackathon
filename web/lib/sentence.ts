// Gloss to sentence, translation and voice. Online: Azure via our API. Offline: local fallbacks.

export type OutputLang = { code: string; name: string; bcp47: string; voice: string };

export const OUTPUT_LANGS: OutputLang[] = [
  { code: "en", name: "English", bcp47: "en-US", voice: "en-US-JennyNeural" },
  { code: "ur", name: "Urdu", bcp47: "ur-PK", voice: "ur-PK-UzmaNeural" },
  { code: "ms", name: "Malay", bcp47: "ms-MY", voice: "ms-MY-YasminNeural" },
  { code: "zh-Hans", name: "Mandarin", bcp47: "zh-CN", voice: "zh-CN-XiaoxiaoNeural" },
  { code: "ta", name: "Tamil", bcp47: "ta-SG", voice: "ta-SG-VenbaNeural" },
  { code: "ar", name: "Arabic", bcp47: "ar-AE", voice: "ar-AE-FatimaNeural" },
];

const online = () => typeof navigator !== "undefined" && navigator.onLine;

export async function glossToSentence(gloss: string[], language = "English"): Promise<string> {
  if (!gloss.length) return "";
  try {
    if (!online()) throw new Error("offline");
    const res = await fetch("/api/sentence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gloss, language }),
    });
    if (!res.ok) throw new Error(String(res.status));
    return (await res.json()).sentence as string;
  } catch {
    return offlineSentence(gloss);
  }
}

function offlineSentence(gloss: string[]): string {
  const s = gloss.map((g) => g.replace(/_/g, " ")).join(" ");
  return s.charAt(0).toUpperCase() + s.slice(1) + ".";
}

/** Translate English text. Returns the original text if offline or on error. */
export async function translateText(text: string, to: string): Promise<string> {
  if (!text || to === "en" || !online()) return text;
  try {
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, to }),
    });
    if (!res.ok) throw new Error(String(res.status));
    return (await res.json()).text as string;
  } catch {
    return text;
  }
}

/** Browser voice (offline). */
export function speak(text: string, lang = "en-US") {
  if (typeof window === "undefined" || !("speechSynthesis" in window) || !text) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

/** Azure neural voice when online, browser voice otherwise. */
export async function speakIn(text: string, out: OutputLang) {
  if (!text) return;
  if (online()) {
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice: out.voice }),
      });
      if (res.ok) {
        const url = URL.createObjectURL(await res.blob());
        const audio = new Audio(url);
        audio.onended = () => URL.revokeObjectURL(url);
        await audio.play();
        return;
      }
    } catch { /* fall back */ }
  }
  speak(text, out.bcp47);
}
