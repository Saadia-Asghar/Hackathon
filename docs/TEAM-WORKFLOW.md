# Team Workflow

## Git
- `main` = always working. Never push broken code to `main`.
- Branch per task: `feat/saadia-translate`, `feat/zakraya-learn`, `feat/umaiza-contribute`.
- Open a Pull Request → one teammate reviews → merge.
- Pull `main` every day: `git pull origin main`.

## First-time setup (everyone)
```bash
git clone https://github.com/Saadia-Asghar/Hackathon.git
cd Hackathon
# ML
cd ml && python -m venv .venv && .venv\Scripts\activate && pip install -r requirements.txt
# Web
cd ../web && npm install && npm run dev   # open http://localhost:3000
```

## Data
- Recordings go to `data/<lang>/<label>/` (gitignored — too big for Git).
- Share recordings via a shared Google Drive / Azure Blob folder; download into `data/` before training.
- Use the **same sign list** per language: `ml/signs_<lang>.txt`.

## Who owns what
See section 9 of `SignBridge-Build-Guide.md`.

## Weekly
- Sunday: each person demos what works, updates the checklist below.

## Checklist
- [ ] Recorder works for all 3 (Saadia)
- [ ] 30 signs × 30 clips recorded per language (all)
- [ ] PSL / SgSL / ASL models > 85% on unseen signer
- [ ] /translate works offline
- [ ] /speak, /learn, /dictionary (Zakraya)
- [ ] /contribute, /validate, SOS, OCR (Umaiza)
- [ ] Azure deployed + /api/sentence live (Saadia)
- [ ] 30+ testers, 3 testimonials (Umaiza)
- [ ] YAI registered by 2 Jan, submitted by 9 Jan
