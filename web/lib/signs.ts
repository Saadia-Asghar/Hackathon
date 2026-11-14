// Sign vocabulary per language. Uses the trained model labels when available, else the default list.
import type { Lang } from "./model";

export const DEFAULT_SIGNS = [
  "hello", "thank_you", "yes", "no", "please", "sorry", "help", "water", "food", "doctor",
  "hospital", "pain", "family", "mother", "father", "name", "what", "where", "when", "how",
  "good", "bad", "eat", "drink", "go", "come", "want", "understand", "dont_understand", "emergency",
];

export async function loadSigns(lang: Lang): Promise<string[]> {
  try {
    const res = await fetch(`/models/${lang}.labels.json`);
    if (res.ok) return (await res.json()).labels as string[];
  } catch { /* offline or missing: use default */ }
  return DEFAULT_SIGNS;
}

export const signVideo = (lang: Lang, word: string) => `/signs/${lang}/${word}.mp4`;
export const letterVideo = (lang: Lang, letter: string) => `/signs/${lang}/letters/${letter}.mp4`;
export const pretty = (s: string) => s.replace(/_/g, " ");

export const LANGS: { id: Lang; name: string }[] = [
  { id: "psl", name: "Pakistan SL" },
  { id: "sgsl", name: "Singapore SL" },
  { id: "asl", name: "American SL" },
];
