// Loads MediaPipe landmarkers from LOCAL files (public/mediapipe) so it works offline.
import { FilesetResolver, HandLandmarker, PoseLandmarker } from "@mediapipe/tasks-vision";

export async function createLandmarkers() {
  const fileset = await FilesetResolver.forVisionTasks("/mediapipe/wasm");
  const hand = await HandLandmarker.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: "/mediapipe/hand_landmarker.task" },
    runningMode: "VIDEO",
    numHands: 2,
  });
  const pose = await PoseLandmarker.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: "/mediapipe/pose_landmarker_lite.task" },
    runningMode: "VIDEO",
  });
  return { hand, pose };
}
