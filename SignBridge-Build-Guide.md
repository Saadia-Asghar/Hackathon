# SignBridge — Full Vibe-Coding Build Guide
For: YAI Singapore Youth AI Hackathon (submit 9 Jan 2027) + Microsoft Imagine Cup 2027 (~28 Feb 2027, confirm)

## 0. Setup
- Tools: VS Code + Cursor or Claude Code, Python 3.11, Node 20, Git + GitHub.
- Accounts: GitHub, Azure (Azure for Students / Microsoft for Startups — required for Imagine Cup), Hugging Face.
- Strategy: build a **Next.js web app first** (fastest to vibe-code, works offline with MediaPipe + ONNX Runtime Web), wrap as mobile (PWA/Capacitor) later.

```
signbridge/
  ml/    # Python: record data, train, export ONNX
  web/   # Next.js app (offline models)
  api/   # Azure Functions backend
  data/  # landmark datasets (gitignored)
  docs/  # pitch, testing notes
```

## 1. Sign recognition model (Week 1)
**Prompt — recorder:**
> Build `ml/record.py` with OpenCV + MediaPipe Holistic. Show webcam, ask for sign label and signer name, record 30-frame clips on SPACE, extract hand, upper-body pose and key face landmarks, normalise relative to shoulders, save as `data/<language>/<label>/<signer>_<n>.npy`, show clip counts per label.

Target: 30 signs × PSL/SgSL/ASL × 30 clips × 5+ people.
Extra data: Google ASL Signs (Kaggle), WLASL, Roboflow SgSL, SgSL Sign Bank & PSL (FESF) videos — ask permission.

**Prompt — training:**
> Write `ml/train.py`: load .npy clips, train a small Transformer/LSTM classifier in PyTorch with augmentation (mirror, scale, time-stretch, noise), validate on unseen signers, print confusion matrix, export ONNX to `web/public/models/<lang>.onnx` + `labels.json`.

Goal: >85% accuracy on unseen signers.

## 2. Core app (Week 1–2)
**Sign → Text/Voice (offline):**
> Next.js + TS + Tailwind. `/translate`: webcam → MediaPipe tasks-vision in browser → 30-frame windows → onnxruntime-web → predicted sign + confidence (ignore <0.7) → sentence bar → SpeechSynthesis. Language selector PSL/SgSL/ASL. Service worker caches everything so it works offline.

**AI sentence builder:**
> Convert gloss ("ME WANT WATER") to a natural sentence. Online: our API → Azure OpenAI. Offline: rule-based fallback, later Phi-4-mini via WebLLM/ONNX.

**Voice/Text → Sign:**
> `/speak`: speech → text (Web Speech online, Whisper tiny via transformers.js offline) → play sign videos `public/signs/<lang>/<word>.mp4` in sequence, fingerspell unknown words.

**Conversation mode:**
> `/conversation`: split screen — deaf user (camera → text/voice) and hearing user (mic → captions + sign videos). Large text, high contrast.

## 3. Learning + Community (Week 2–3)
- `/learn`: lessons of 5 signs, user performs to webcam, scored by the model; XP, streaks, levels (IndexedDB offline, cloud sync). Tracks: Family, School, Workplace.
- `/contribute`: record 5 attempts of a sign, store **landmarks only**, explicit consent, upload to Azure Blob when online.
- `/validate`: deaf validators approve/reject clips; contributor points for payouts.
- `/dictionary`: search by word or by signing.
- **SOS mode:** preset phrases (doctor / police / I am deaf / call family) in big text + voice + sign video, optional location.

## 4. Azure backend (Week 3) — required for Imagine Cup
> Azure Functions API: `/sentence` (Azure OpenAI), `/translate` (AI Translator), `/tts` (AI Speech, Urdu/Malay/Mandarin/Tamil), `/ocr` (AI Vision: document → plain language → sign), `/upload` (Blob), `/user` (Cosmos DB). Auth: Microsoft Entra External ID. Keys in Key Vault/env vars, never in frontend.

- Retrain in Azure Machine Learning from community data; app downloads new ONNX versions.
- Deploy: web → Azure Static Web Apps, API → Azure Functions. Document every Azure service.

## 5. Business features (Jan–Feb, Imagine Cup)
1. `/kiosk`: locked full-screen tablet mode for counters, branding, offline.
2. `/org` dashboard: usage, languages, staff training, compliance PDF.
3. Microsoft Teams app: live sign captions panel (Teams Toolkit).
4. Developer API: keys + per-minute metering.
5. Pricing page (Stripe **test mode** only).

## 6. Responsible AI
Confidence + "please repeat"; no raw video stored; on-device by default; consent for data; deaf validators; "not a replacement for certified interpreters in legal/medical decisions"; deaf advisors credited.

## 7. Testing & traction
- Contact SADeaf (Singapore), deaf schools/FESF/NGOs (Pakistan), uni disability clubs, deaf online communities.
- Goal: 30–50 testers, feedback form, 3 video testimonials.
- Imagine Cup: 1–2 letters of intent / pilots.

## 8. Timeline
| When | Do |
|---|---|
| Now → 20 Nov | Confirm eligibility (support@ycess.com, Imagine Cup rules), setup, record data |
| 20 Nov → 5 Dec | Train model, `/translate`, `/speak` |
| 5 Dec → 20 Dec | Learn, contribute, dictionary, SOS, offline polish |
| 20 Dec → 2 Jan | Azure backend + deploy, user testing, **register YAI by 2 Jan** |
| 2 → 9 Jan | Bug fixes, 2-min demo video, **YAI submission** |
| 13–17 Jan | YAI finalists / Demo Weekend |
| Jan → Feb | Kiosk, dashboard, Teams app, pilots, business plan → **Imagine Cup** |

## 9. Team roles (3 members, equal split)
Each person owns one sign language's model **and** full features end-to-end (UI + AI + Azure) **and** one non-code area.

**You — "Translate" owner**
- ML: PSL model (record, train, ONNX)
- Features: `/translate` (sign → voice, offline), AI sentence builder (Azure OpenAI + offline fallback), `/conversation`
- Azure: project setup, Functions base, Azure OpenAI, deploy (Static Web Apps)
- Non-code: team lead, registrations (YAI, Imagine Cup), GitHub repo, final integration

**Zakraya — "Speak & Learn" owner**
- ML: SgSL model (record, train, ONNX)
- Features: app shell + UI design + offline/PWA, `/speak` (voice → sign + fingerspelling), `/learn` (XP, streaks, tracks), `/dictionary`
- Azure: AI Speech (TTS/STT), AI Translator
- Non-code: 2-min demo video, app screenshots, UI/UX testing

**Umaiza — "Community & Business" owner**
- ML: ASL model (record, train, ONNX) + Azure ML retraining
- Features: `/contribute`, `/validate`, SOS mode, document → sign (Azure AI Vision OCR), Imagine Cup `/kiosk`, `/org` dashboard, pricing page
- Azure: Blob Storage, Cosmos DB, login (Entra)
- Non-code: deaf community contacts + user testing, pitch decks, business model, pilot partners / letters of intent

**Shared by all:** same recorder + training script (built once, reused for 3 languages), record signs for each other's datasets, Responsible AI doc, test every feature, weekly demo every Sunday.

## 10. Pitches
- **YAI:** "70M deaf people, 300+ sign languages, almost no AI tools. SignBridge translates sign ↔ speech offline, teaches families to sign, and lets the deaf community build its own data — starting with Singapore and Pakistan."
- **Imagine Cup:** "Interpreters cost $50–100/hour. SignBridge is an offline, private, Azure-powered sign-language platform — kiosk, Teams plugin, API — at ~1% of the cost. Free for deaf users, paid for organisations."
- **Demo trick:** switch off Wi-Fi on stage and keep translating.

## Vibe-coding tips
One page at a time → test → commit. Paste errors back to the AI. Get few signs accurate before adding more. Never put API keys in frontend code.
