"""E4: Download APPROVED community clips from Azure Blob into data/ for retraining.

Usage:
    set AZURE_STORAGE_CONNECTION_STRING=...
    python sync_contributions.py            # approved only
    python sync_contributions.py --all      # include pending (not recommended)
Then retrain:  python train.py --lang psl
Clips are saved as data/<lang>/<label>/community_<id>.npy so train.py treats "community" as one signer.
"""
from __future__ import annotations

import argparse
import json
import os
from pathlib import Path

import numpy as np
from azure.storage.blob import BlobServiceClient

from features import FEATURES, FRAMES

ROOT = Path(__file__).resolve().parent.parent


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--all", action="store_true", help="also download clips not yet approved")
    args = ap.parse_args()

    container = BlobServiceClient.from_connection_string(os.environ["AZURE_STORAGE_CONNECTION_STRING"]).get_container_client("contributions")
    saved = skipped = 0
    for blob in container.list_blobs():
        rec = json.loads(container.download_blob(blob.name).readall())
        if not rec.get("consent") or (rec.get("status") != "approved" and not args.all):
            skipped += 1
            continue
        clip = np.asarray(rec["clip"], dtype=np.float32)
        if clip.shape != (FRAMES, FEATURES):
            skipped += 1
            continue
        out = ROOT / "data" / rec["lang"] / rec["label"]
        out.mkdir(parents=True, exist_ok=True)
        np.save(out / f"community_{Path(blob.name).stem}.npy", clip)
        saved += 1
    print(f"saved {saved} clips, skipped {skipped}")


if __name__ == "__main__":
    main()
