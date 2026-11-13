"""Record sign clips as landmark sequences.

Usage:
    python record.py --lang psl --signer saadia
Keys: SPACE = record one clip of the current sign, N = next sign, P = previous sign, Q = quit.
Clips are saved to data/<lang>/<label>/<signer>_<n>.npy with shape (30, 177).
"""
from __future__ import annotations

import argparse
import time
import urllib.request
from pathlib import Path

import cv2
import mediapipe as mp
import numpy as np
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision

from features import FRAMES, build_frame

ROOT = Path(__file__).resolve().parent.parent
MODELS = Path(__file__).resolve().parent / "mp_models"
HAND_URL = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task"
POSE_URL = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task"


def ensure_model(url: str) -> Path:
    MODELS.mkdir(exist_ok=True)
    path = MODELS / url.rsplit("/", 1)[-1]
    if not path.exists():
        print(f"Downloading {path.name} ...")
        urllib.request.urlretrieve(url, path)
    return path


def make_landmarkers():
    hand = vision.HandLandmarker.create_from_options(
        vision.HandLandmarkerOptions(
            base_options=mp_python.BaseOptions(model_asset_path=str(ensure_model(HAND_URL))),
            running_mode=vision.RunningMode.VIDEO,
            num_hands=2,
        )
    )
    pose = vision.PoseLandmarker.create_from_options(
        vision.PoseLandmarkerOptions(
            base_options=mp_python.BaseOptions(model_asset_path=str(ensure_model(POSE_URL))),
            running_mode=vision.RunningMode.VIDEO,
        )
    )
    return hand, pose


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--lang", required=True, choices=["psl", "sgsl", "asl"])
    ap.add_argument("--signer", required=True, help="your name, lowercase")
    ap.add_argument("--camera", type=int, default=0)
    args = ap.parse_args()

    signs = [s.strip() for s in (Path(__file__).parent / f"signs_{args.lang}.txt").read_text(encoding="utf-8").splitlines() if s.strip()]
    hand, pose = make_landmarkers()
    cap = cv2.VideoCapture(args.camera)
    idx, recording, buf = 0, False, []
    start = time.monotonic()

    while True:
        ok, frame_bgr = cap.read()
        if not ok:
            print("Camera not available")
            break
        ts = int((time.monotonic() - start) * 1000)
        rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)  # NOT mirrored (contract)
        image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
        feat = build_frame(hand.detect_for_video(image, ts), pose.detect_for_video(image, ts))

        label = signs[idx]
        out_dir = ROOT / "data" / args.lang / label
        count = len(list(out_dir.glob("*.npy"))) if out_dir.exists() else 0

        if recording:
            if feat is not None:
                buf.append(feat)
            if len(buf) >= FRAMES:
                out_dir.mkdir(parents=True, exist_ok=True)
                np.save(out_dir / f"{args.signer}_{int(time.time() * 1000)}.npy", np.stack(buf[:FRAMES]))
                recording, buf = False, []

        display = cv2.flip(frame_bgr, 1)  # mirror ONLY for display
        status = "REC" if recording else ("OK" if feat is not None else "NO SHOULDERS - step back")
        cv2.putText(display, f"[{args.lang}] {label}  clips: {count}", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
        cv2.putText(display, status, (10, 65), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255) if recording else (255, 255, 0), 2)
        cv2.putText(display, "SPACE rec  N next  P prev  Q quit", (10, display.shape[0] - 15), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)
        cv2.imshow("SignBridge recorder", display)

        key = cv2.waitKey(1) & 0xFF
        if key == ord("q"):
            break
        if key == ord(" ") and not recording:
            recording, buf = True, []
        if key == ord("n"):
            idx = (idx + 1) % len(signs)
        if key == ord("p"):
            idx = (idx - 1) % len(signs)

    cap.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
