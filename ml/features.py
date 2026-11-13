"""Feature contract — MUST match web/lib/features.ts exactly. See docs/ARCHITECTURE.md."""
from __future__ import annotations

import numpy as np

FEATURE_VERSION = 1
FRAMES = 30
HAND_POINTS = 21
POSE_POINTS = 17  # pose indices 0..16 (upper body)
FEATURES = HAND_POINTS * 3 * 2 + POSE_POINTS * 3  # 177


def build_frame(hand_result, pose_result) -> np.ndarray | None:
    """Turn MediaPipe Tasks results for ONE frame into 177 floats, or None if no shoulders."""
    if not pose_result.pose_landmarks:
        return None
    pose = pose_result.pose_landmarks[0]
    ls, rs = pose[11], pose[12]
    cx, cy = (ls.x + rs.x) / 2, (ls.y + rs.y) / 2
    scale = float(np.hypot(ls.x - rs.x, ls.y - rs.y))
    if scale < 1e-6:
        return None

    left = np.zeros(HAND_POINTS * 3, dtype=np.float32)
    right = np.zeros(HAND_POINTS * 3, dtype=np.float32)
    for lms, handed in zip(hand_result.hand_landmarks, hand_result.handedness):
        arr = np.array(
            [[(p.x - cx) / scale, (p.y - cy) / scale, p.z / scale] for p in lms],
            dtype=np.float32,
        ).reshape(-1)
        if handed[0].category_name == "Left":
            left = arr
        else:
            right = arr

    pose_arr = np.array(
        [[(p.x - cx) / scale, (p.y - cy) / scale, 0.0] for p in pose[:POSE_POINTS]],
        dtype=np.float32,
    ).reshape(-1)

    frame = np.concatenate([left, right, pose_arr])
    assert frame.shape == (FEATURES,)
    return frame


def mirror_clip(clip: np.ndarray) -> np.ndarray:
    """Augmentation: flip x and swap left/right hands. clip shape (FRAMES, 177)."""
    c = clip.copy().reshape(clip.shape[0], -1, 3)
    c[:, :, 0] *= -1
    hp = HAND_POINTS
    left, right = c[:, :hp].copy(), c[:, hp : 2 * hp].copy()
    c[:, :hp], c[:, hp : 2 * hp] = right, left
    return c.reshape(clip.shape)
