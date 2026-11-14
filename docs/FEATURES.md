# SignBridge — Detailed Feature Specs

Status: ✅ built (starter) · 🟡 partly built · ⬜ not started. Owner in brackets.
Every feature must work offline (degraded) — see `docs/ARCHITECTURE.md`.

## A. Core translation

### A1. Sign → Text/Voice `/translate` ✅ [Saadia]
- Camera → MediaPipe hand + pose → 177 features/frame → 30-frame window → ONNX model.
- Current sign + confidence bar; accepted signs (conf ≥ 0.7, 3 in a row, 1.5 s cooldown) go to a sentence bar.
- "Make sentence + speak": `/api/sentence` online, rule fallback offline; SpeechSynthesis voice.
- Done when: 30 signs per language, >85% on an unseen signer, works with Wi-Fi off.

### A2. Voice/Text → Sign `/speak` ✅ starter [Zakraya]
- Type or speak (Web Speech API where available).
- Known words play `public/signs/<lang>/<word>.mp4`; unknown words fingerspelled from `public/signs/<lang>/letters/<a-z>.mp4`, else shown as text.
- Done when: 30 sign videos + 26 letters per language. Later: 3D avatar, Whisper offline, Azure Speech online.

### A3. Conversation mode `/conversation` ✅ [Saadia]
- Split screen: deaf user (A1) top, hearing user (A2 + captions) bottom. Big text, high contrast.

### A4. AI sentence builder ✅ [Saadia]
- `POST /api/sentence {gloss[], language}` → Azure OpenAI, one sentence, no invented facts. Offline: rules. Later: Phi-4-mini in browser.

### A5. Multilingual output ✅ (voice picker in SignToText, /api/translate + /api/tts, offline browser voice) [Zakraya]
- `POST /api/translate {text, to}` → Azure AI Translator. `POST /api/tts` → Azure AI Speech; offline → SpeechSynthesis.

## B. Learning

### B1. SignLearn `/learn` ✅ starter [Zakraya]
- Lessons of 5 signs: watch video → perform → A1 model scores (correct label, conf ≥ 0.6).
- XP +10 per correct, daily streak, level = XP/100, saved in localStorage (later IndexedDB + cloud).
- Tracks: Family, School, Workplace. Done when: 6 lessons per language.

### B2. Dictionary `/dictionary` ✅ starter [Zakraya]
- Search word → video. Later: search by signing.

## C. Community & safety

### C1. Contribute `/contribute` ✅ starter [Umaiza]
- Pick sign → record 30-frame landmark clip (no video) → consent required → offline queue → `POST /api/contribute` when online.

### C2. Validate `/validate` ✅ local skeleton replay; Blob sync todo [Umaiza]
- Deaf validators replay skeleton animation, approve/reject; approved clips → Azure ML retraining; contributor points.

### C3. SOS `/sos` ✅ [Umaiza]
- Big preset phrases → full-screen text + spoken aloud. Location only when tapped. 100% offline.

### C4. Document → Sign `/document` ✅ [Umaiza]
- Photo → `/api/ocr` (Azure AI Vision) → plain-language summary → A2 plays signs.

## D. Business (Imagine Cup)
| ID | Feature | Owner | Status |
|---|---|---|---|
| D1 | `/kiosk?org=Name&lang=psl` counter mode, auto-reset 60 s | Umaiza | ✅ |
| D2 | `/org` dashboard: tiles, 7-day chart, CSV, print-to-PDF (local; Cosmos DB todo) | Umaiza | ✅ |
| D3 | Microsoft Teams side-panel app (Teams Toolkit) | Saadia | ⬜ |
| D4 | Developer API: keys, metering, `/api/v1/recognize` (landmarks only) | Saadia | ⬜ |
| D5 | `/pricing` page (payments later, Stripe test mode) | Zakraya | ✅ |

## E. Platform
| ID | Feature | Owner | Status |
|---|---|---|---|
| E1 | PWA: `public/sw.js` + manifest (production only) | Zakraya | ✅ |
| E2 | Login (Microsoft Entra External ID) | Umaiza | ⬜ |
| E3 | Azure deploy: `.github/workflows/azure-static-web-apps.yml` (needs secret) | Saadia | 🟡 |
| E4 | Azure ML retraining pipeline | Umaiza | ⬜ |
| E5 | Responsible AI page `/about` | all | ✅ |
