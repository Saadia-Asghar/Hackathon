"""Train a sign classifier for one language and export ONNX for the web app.

Usage:
    python train.py --lang psl
Validation uses one held-out signer (unseen person) so accuracy is honest.
Outputs: web/public/models/<lang>.onnx and <lang>.labels.json
"""
from __future__ import annotations

import argparse
import json
import random
from pathlib import Path

import numpy as np
import torch
from torch import nn

from features import FEATURE_VERSION, FEATURES, FRAMES, mirror_clip

ROOT = Path(__file__).resolve().parent.parent


class SignModel(nn.Module):
    def __init__(self, n_classes: int, hidden: int = 128):
        super().__init__()
        self.proj = nn.Sequential(nn.Linear(FEATURES, hidden), nn.LayerNorm(hidden), nn.GELU(), nn.Dropout(0.2))
        self.gru = nn.GRU(hidden, hidden, num_layers=2, batch_first=True, bidirectional=True, dropout=0.2)
        self.head = nn.Sequential(nn.Dropout(0.3), nn.Linear(hidden * 2, n_classes))

    def forward(self, x: torch.Tensor) -> torch.Tensor:  # x: [B, 30, 177]
        h, _ = self.gru(self.proj(x))
        return self.head(h.mean(dim=1))


def load(lang: str):
    base = ROOT / "data" / lang
    labels = sorted(p.name for p in base.iterdir() if p.is_dir() and any(p.glob("*.npy")))
    items = []
    for i, lab in enumerate(labels):
        for f in (base / lab).glob("*.npy"):
            clip = np.load(f).astype(np.float32)
            if clip.shape == (FRAMES, FEATURES):
                items.append((clip, i, f.stem.split("_")[0]))
    return labels, items


def augment(clip: np.ndarray) -> np.ndarray:
    if random.random() < 0.5:
        clip = mirror_clip(clip)
    clip = clip * np.float32(random.uniform(0.9, 1.1))
    # time stretch: resample 30 frames from a random sub-range
    s = random.randint(0, 4)
    e = random.randint(FRAMES - 4, FRAMES)
    idx = np.linspace(s, e - 1, FRAMES).round().astype(int)
    clip = clip[idx]
    return clip + np.random.normal(0, 0.01, clip.shape).astype(np.float32)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--lang", required=True, choices=["psl", "sgsl", "asl"])
    ap.add_argument("--epochs", type=int, default=80)
    ap.add_argument("--val-signer", default=None, help="signer held out for validation (default: last alphabetically)")
    args = ap.parse_args()

    labels, items = load(args.lang)
    if len(labels) < 2:
        raise SystemExit("Need at least 2 signs recorded in data/<lang>/")
    signers = sorted({s for _, _, s in items})
    val_signer = args.val_signer or (signers[-1] if len(signers) > 1 else None)
    train = [x for x in items if x[2] != val_signer]
    val = [x for x in items if x[2] == val_signer] or random.sample(items, max(1, len(items) // 5))
    print(f"{len(labels)} signs, {len(train)} train clips, {len(val)} val clips (val signer: {val_signer})")

    model = SignModel(len(labels))
    opt = torch.optim.AdamW(model.parameters(), lr=1e-3, weight_decay=1e-2)
    loss_fn = nn.CrossEntropyLoss(label_smoothing=0.1)
    xv = torch.tensor(np.stack([c for c, _, _ in val]))
    yv = torch.tensor([y for _, y, _ in val])
    best, best_state = 0.0, None

    for epoch in range(args.epochs):
        model.train()
        random.shuffle(train)
        for i in range(0, len(train), 32):
            batch = train[i : i + 32]
            xb = torch.tensor(np.stack([augment(c) for c, _, _ in batch]))
            yb = torch.tensor([y for _, y, _ in batch])
            opt.zero_grad()
            loss = loss_fn(model(xb), yb)
            loss.backward()
            opt.step()
        model.eval()
        with torch.no_grad():
            acc = (model(xv).argmax(1) == yv).float().mean().item()
        if acc >= best:
            best, best_state = acc, {k: v.clone() for k, v in model.state_dict().items()}
        if epoch % 10 == 0 or epoch == args.epochs - 1:
            print(f"epoch {epoch:3d}  loss {loss.item():.3f}  val acc {acc:.2%}  best {best:.2%}")

    model.load_state_dict(best_state)
    model.eval()
    with torch.no_grad():
        pred = model(xv).argmax(1)
    confusion = np.zeros((len(labels), len(labels)), dtype=int)
    for t, p in zip(yv.tolist(), pred.tolist()):
        confusion[t, p] += 1
    print("Most confused pairs:")
    for t in range(len(labels)):
        for p in range(len(labels)):
            if t != p and confusion[t, p] > 0:
                print(f"  {labels[t]} -> {labels[p]}: {confusion[t, p]}")

    out = ROOT / "web" / "public" / "models"
    out.mkdir(parents=True, exist_ok=True)
    torch.onnx.export(
        model, torch.zeros(1, FRAMES, FEATURES), out / f"{args.lang}.onnx",
        input_names=["input"], output_names=["logits"], opset_version=17,
    )
    (out / f"{args.lang}.labels.json").write_text(
        json.dumps({"featureVersion": FEATURE_VERSION, "labels": labels}, indent=2), encoding="utf-8"
    )
    print(f"Saved {out / (args.lang + '.onnx')}  (best val acc {best:.2%})")


if __name__ == "__main__":
    main()
