# SignBridge

AI sign-language translator (PSL, SgSL, ASL), offline-first.
Team: Saadia, Zakraya, Umaiza.

## Start here
1. [SignBridge-Build-Guide.md](SignBridge-Build-Guide.md): plan, features, timeline, who does what
2. [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): system design and THE feature contract (read before coding)
3. [docs/TEAM-WORKFLOW.md](docs/TEAM-WORKFLOW.md): Git branches, setup, checklist
4. [CLAUDE.md](CLAUDE.md): rules for AI coding tools (Claude Code / Cursor)

## Folders
- `ml/`: `record.py` (record signs), `train.py` (train + export ONNX), `features.py` (contract)
- `web/`: Next.js app. `/translate` works once a model exists in `web/public/models/`
- `api/`: Azure Functions (`/api/sentence` with Azure OpenAI, `/api/contribute` stub)

## Quick start
```bash
# 1. record signs (each teammate, own language)
cd ml && pip install -r requirements.txt
python record.py --lang psl --signer saadia
# 2. train (needs 2+ signs recorded, ideally 2+ signers)
python train.py --lang psl
# 3. run the app
cd ../web && npm install && npm run dev   # http://localhost:3000/translate
```
