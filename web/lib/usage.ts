// Local usage log for the org dashboard (D2). Later: sync to Cosmos DB.
export type UsageEvent = { type: "sentence" | "lesson" | "sos" | "document" | "contribute"; lang: string; at: string };
const KEY = "signbridge.usage";

export function readUsage(): UsageEvent[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]") as UsageEvent[]; } catch { return []; }
}

export function logUsage(type: UsageEvent["type"], lang = "-") {
  try {
    const all = readUsage();
    all.push({ type, lang, at: new Date().toISOString() });
    localStorage.setItem(KEY, JSON.stringify(all.slice(-5000)));
  } catch { /* storage blocked */ }
}
