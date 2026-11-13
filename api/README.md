# SignBridge API (Azure Functions, Python)

Local run:
1. Install Azure Functions Core Tools v4 and Python 3.11.
2. `cd api && python -m venv .venv && .venv\Scripts\activate && pip install -r requirements.txt`
3. Copy `local.settings.example.json` to `local.settings.json` and fill in your Azure OpenAI values (this file is gitignored).
4. `func start` -> http://localhost:7071/api/health

Run web + api together like production: `npm i -g @azure/static-web-apps-cli` then from repo root
`swa start http://localhost:3000 --api-location api` (with `npm run dev` running in web/).

Endpoints: `GET /api/health`, `POST /api/sentence {gloss, language}`, `POST /api/contribute {clip, consent}` (stub).
To add: `/api/translate` (AI Translator), `/api/tts` (AI Speech), `/api/ocr` (AI Vision).
