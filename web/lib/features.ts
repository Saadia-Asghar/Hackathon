// Feature contract — MUST match ml/features.py exactly. See docs/ARCHITECTURE.md.
import type { HandLandmarkerResult, PoseLandmarkerResult } from "@mediapipe/tasks-vision";

export const FEATURE_VERSION = 1;
export const FRAMES = 30;
export const HAND_POINTS = 21;
export const POSE_POINTS = 17;
export const FEATURES = HAND_POINTS * 3 * 2 + POSE_POINTS * 3; // 177

export function buildFrame(hands: HandLandmarkerResult, pose: PoseLandmarkerResult): Float32Array | null {
  if (!pose.landmarks.length) return null;
  const p = pose.landmarks[0];
  const ls = p[11], rs = p[12];
  const cx = (ls.x + rs.x) / 2, cy = (ls.y + rs.y) / 2;
  const scale = Math.hypot(ls.x - rs.x, ls.y - rs.y);
  if (scale < 1e-6) return null;

  const out = new Float32Array(FEATURES); // zeros = missing hand
  hands.landmarks.forEach((lms, i) => {
    const side = hands.handedness[i]?.[0]?.categoryName;
    const offset = side === "Left" ? 0 : HAND_POINTS * 3;
    lms.forEach((pt, j) => {
      out[offset + j * 3] = (pt.x - cx) / scale;
      out[offset + j * 3 + 1] = (pt.y - cy) / scale;
      out[offset + j * 3 + 2] = pt.z / scale;
    });
  });
  const base = HAND_POINTS * 3 * 2;
  for (let j = 0; j < POSE_POINTS; j++) {
    out[base + j * 3] = (p[j].x - cx) / scale;
    out[base + j * 3 + 1] = (p[j].y - cy) / scale;
    out[base + j * 3 + 2] = 0;
  }
  return out;
}
