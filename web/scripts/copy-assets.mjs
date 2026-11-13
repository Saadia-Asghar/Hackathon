// Copies MediaPipe + ONNX Runtime files into public/ so the app works OFFLINE (no CDN at runtime).
// Runs automatically after `npm install`.
import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pub = join(root, "public");

function copyDir(src, dest, filter = () => true) {
  mkdirSync(dest, { recursive: true });
  for (const f of readdirSync(src)) if (filter(f)) cpSync(join(src, f), join(dest, f));
}

copyDir(join(root, "node_modules/@mediapipe/tasks-vision/wasm"), join(pub, "mediapipe/wasm"));
copyDir(join(root, "node_modules/onnxruntime-web/dist"), join(pub, "ort"), (f) => f.endsWith(".wasm") || f.endsWith(".mjs"));

const models = {
  "hand_landmarker.task": "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
  "pose_landmarker_lite.task": "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
};
for (const [name, url] of Object.entries(models)) {
  const dest = join(pub, "mediapipe", name);
  if (existsSync(dest)) continue;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${url}`);
  writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
  console.log("downloaded", name);
}
console.log("Offline assets ready in public/");
