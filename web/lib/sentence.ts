// Gloss to sentence. Online: Azure OpenAI via our API. Offline: simple rules.
export async function glossToSentence(gloss: string[], language = "English"): Promise<string> {
  if (!gloss.length) return "";
  try {
    if (!navigator.onLine) throw new Error("offline");
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

export function speak(text: string, lang = "en-US") {
  if (!("speechSynthesis" in window) || !text) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}
