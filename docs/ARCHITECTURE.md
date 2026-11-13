# SignBridge Architecture

## Goals
1. Works **offline** after first load (recognition, speech, learning).
2. **Private**: raw video never leaves the device. Only landmarks (numbers) are uploaded, and only with consent.
3. **One feature contract** shared by Python (training) and TypeScript (app), so a model trained in `ml/` works unchanged in `web/`.
4. Azure for everything online (Imagine Cup requirement).

## System diagram
```
 BROWSER / PHONE (offline-capable PWA)
 ┌──────────────────────────────────────────────────────────┐
 │ Camera ─► MediaPipe HandLandmarker + PoseLandmarker      │
 │        ─► features.ts (177 numbers / frame, see contract) │
 │        ─► 30-frame window ─► onnxruntime-web (<lang>.onnx)│
 │        ─► label + confidence ─► sentence bar             │
 │        ─► sentence builder (online: API, offline: rules)  │
 │        ─► SpeechSynthesis (voice out)                     │
 │ Mic ─► speech-to-text ─► sign videos (/public/signs)      │
 │ IndexedDB: progress, queued contributions                 │
 │ Service worker: caches app, models, sign videos           │
 └───────────────┬──────────────────────────────────────────┘
                 │ HTTPS (only when online)
 ┌───────────────▼──────────────── AZURE ────────────────────┐
 │ Static Web Apps (hosts web/)                               │
 │ Functions (api/): /api/sentence /api/translate /api/tts    │
 │                   /api/ocr /api/contribute                 │
 │ Azure OpenAI · AI Speech · AI Translator · AI Vision       │
 │ Blob Storage (landmark dataset) · Cosmos DB (users, orgs)  │
 │ Azure ML (retrain → new .onnx → Blob → app downloads)      │
 └────────────────────────────────────────────────────────────┘
```

## Folder layout
```
ml/        Python: record.py, features.py, train.py (exports ONNX)
web/       Next.js (App Router, TypeScript) — the app
  lib/features.ts   MUST match ml/features.py exactly
  lib/model.ts      ONNX loading + inference
  public/models/    <lang>.onnx + <lang>.labels.json
  public/signs/     <lang>/<word>.mp4 sign videos
api/       Azure Functions (Python v2 model)
data/      Recorded .npy clips (gitignored; back up to Azure Blob / Drive)
docs/      Architecture, team rules, testing notes
```

## THE FEATURE CONTRACT (most important rule)
Every frame becomes exactly **177 float32 numbers**, in this order:

| Part | Points | Values |
|---|---|---|
| Left hand | 21 hand landmarks | x, y, z → 63 |
| Right hand | 21 hand landmarks | x, y, z → 63 |
| Upper-body pose | pose indices 0–16 (17 points) | x, y, 0 → 51 |

Rules:
- Missing hand → its 63 values are **0**.
- "Left"/"Right" = MediaPipe handedness label on the **un-mirrored** camera frame. Mirror the video only on screen (CSS), never before inference — in Python and JS.
- Normalisation: origin = midpoint of shoulders (pose 11 & 12); divide x, y, z by the 2D shoulder distance. If shoulders aren't visible, skip the frame.
- Pose z is always 0 (unreliable).
- A clip = **30 frames** → model input `[1, 30, 177]` named `input`, output `logits` over labels in `<lang>.labels.json`.
- Language codes: `psl`, `sgsl`, `asl`.

If you change any of this, change **both** `ml/features.py` and `web/lib/features.ts` in the same commit and bump `FEATURE_VERSION` in both.

## Recognition settings (app)
- Sliding window of 30 frames, predict every 5 frames.
- Accept a sign only if confidence ≥ 0.7 and the same label wins 3 predictions in a row.
- After accepting, ignore the same label for 1.5 s.

## Online vs offline
| Feature | Offline | Online (better) |
|---|---|---|
| Sign → label | ONNX in browser | same |
| Gloss → sentence | rule templates | Azure OpenAI |
| Voice out | SpeechSynthesis | Azure AI Speech neural voices |
| Speech → text | Whisper tiny (later) | Azure AI Speech |
| Translation | – | Azure AI Translator |
| Document OCR | – | Azure AI Vision |

## Security
- No API keys in `web/`. Only `api/` reads keys from environment / Key Vault.
- `.env` files are gitignored; copy `.env.example`.
- Uploads: landmarks only, consent required, server validates shape `[30,177]`.
