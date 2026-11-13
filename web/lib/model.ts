// ONNX sign classifier. Model + labels come from ml/train.py.
import * as ort from "onnxruntime-web";
import { FEATURES, FEATURE_VERSION, FRAMES } from "./features";

export type Lang = "psl" | "sgsl" | "asl";
export type Prediction = { label: string; confidence: number };

ort.env.wasm.wasmPaths = "/ort/"; // local files, works offline

export class SignModel {
  private constructor(private session: ort.InferenceSession, readonly labels: string[]) {}

  static async load(lang: Lang): Promise<SignModel> {
    const res = await fetch(`/models/${lang}.labels.json`);
    if (!res.ok) throw new Error(`No model for ${lang} yet. Run: python ml/train.py --lang ${lang}`);
    const meta = await res.json();
    if (meta.featureVersion !== FEATURE_VERSION) throw new Error("Model feature version mismatch. Retrain the model.");
    const session = await ort.InferenceSession.create(`/models/${lang}.onnx`, { executionProviders: ["wasm"] });
    return new SignModel(session, meta.labels);
  }

  async predict(frames: Float32Array[]): Promise<Prediction> {
    const data = new Float32Array(FRAMES * FEATURES);
    frames.slice(-FRAMES).forEach((f, i) => data.set(f, i * FEATURES));
    const out = await this.session.run({ input: new ort.Tensor("float32", data, [1, FRAMES, FEATURES]) });
    const logits = out.logits.data as Float32Array;
    const max = Math.max(...logits);
    const exps = Array.from(logits, (v) => Math.exp(v - max));
    const sum = exps.reduce((a, b) => a + b, 0);
    let best = 0;
    exps.forEach((v, i) => { if (v > exps[best]) best = i; });
    return { label: this.labels[best], confidence: exps[best] / sum };
  }
}

/** Accept a sign only when confident and stable (see docs/ARCHITECTURE.md). */
export class Stabilizer {
  private streak = 0;
  private last = "";
  private lastAccepted = "";
  private lastTime = 0;
  constructor(private minConf = 0.7, private needed = 3, private cooldownMs = 1500) {}

  push(p: Prediction): string | null {
    if (p.confidence < this.minConf) { this.streak = 0; return null; }
    this.streak = p.label === this.last ? this.streak + 1 : 1;
    this.last = p.label;
    const now = Date.now();
    if (this.streak >= this.needed && !(p.label === this.lastAccepted && now - this.lastTime < this.cooldownMs)) {
      this.lastAccepted = p.label; this.lastTime = now; this.streak = 0;
      return p.label;
    }
    return null;
  }
}
