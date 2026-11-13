# Rules for AI coding assistants (Claude Code, Cursor, Copilot)

Read `docs/ARCHITECTURE.md` before changing anything.

1. **Feature contract is sacred.** `ml/features.py` and `web/lib/features.ts` must produce identical 177-value frames. Never change one without the other.
2. **Never put API keys in `web/`.** Browser code calls `/api/*` only. Keys live in `api/local.settings.json` (gitignored) or Azure app settings.
3. **Offline first.** Every page in `web/` must still work (degraded) with no internet. Online calls need a try/catch fallback.
4. **No raw video upload or storage.** Only landmarks, only with consent.
5. Model files: `web/public/models/<lang>.onnx` + `<lang>.labels.json`, lang ∈ {psl, sgsl, asl}.
6. TypeScript strict, small components, one page per folder in `web/app/`.
7. Python: type hints, `pathlib`, no hard-coded absolute paths.
8. Before committing: `npm run build` in `web/` must pass; `python -m py_compile` on changed Python files.
9. Work on your own branch (`feat/<name>-<feature>`), open a PR, a teammate reviews.
