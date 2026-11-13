"""SignBridge API (Azure Functions, Python v2 model). Keys come from app settings, never the browser."""
from __future__ import annotations

import json
import os

import azure.functions as func
from openai import AzureOpenAI

app = func.FunctionApp(http_auth_level=func.AuthLevel.ANONYMOUS)

MAX_GLOSS = 40


def _json(body: dict, status: int = 200) -> func.HttpResponse:
    return func.HttpResponse(json.dumps(body), status_code=status, mimetype="application/json")


@app.route(route="health", methods=["GET"])
def health(req: func.HttpRequest) -> func.HttpResponse:
    return _json({"ok": True})


@app.route(route="sentence", methods=["POST"])
def sentence(req: func.HttpRequest) -> func.HttpResponse:
    """Turn sign gloss (e.g. ["me", "want", "water"]) into a natural sentence."""
    try:
        data = req.get_json()
        gloss = [str(g)[:40] for g in data.get("gloss", [])][:MAX_GLOSS]
        language = str(data.get("language", "English"))[:30]
    except ValueError:
        return _json({"error": "invalid JSON"}, 400)
    if not gloss:
        return _json({"error": "gloss is empty"}, 400)

    client = AzureOpenAI(
        azure_endpoint=os.environ["AZURE_OPENAI_ENDPOINT"],
        api_key=os.environ["AZURE_OPENAI_KEY"],
        api_version=os.environ.get("AZURE_OPENAI_API_VERSION", "2024-10-21"),
    )
    resp = client.chat.completions.create(
        model=os.environ["AZURE_OPENAI_DEPLOYMENT"],
        temperature=0.2,
        max_tokens=80,
        messages=[
            {
                "role": "system",
                "content": (
                    "You convert sign-language gloss into ONE short, natural sentence in the requested language. "
                    "Do not add facts that are not in the gloss. Reply with the sentence only."
                ),
            },
            {"role": "user", "content": f"Language: {language}\nGloss: {' '.join(gloss)}"},
        ],
    )
    return _json({"sentence": resp.choices[0].message.content.strip()})


@app.route(route="contribute", methods=["POST"])
def contribute(req: func.HttpRequest) -> func.HttpResponse:
    """Stub for Umaiza: validate a landmark clip [30][177] + consent, then save to Blob Storage."""
    try:
        data = req.get_json()
    except ValueError:
        return _json({"error": "invalid JSON"}, 400)
    clip = data.get("clip")
    if data.get("consent") is not True:
        return _json({"error": "consent required"}, 400)
    if not (isinstance(clip, list) and len(clip) == 30 and all(isinstance(f, list) and len(f) == 177 for f in clip)):
        return _json({"error": "clip must be 30 x 177 numbers"}, 400)
    # TODO(Umaiza): upload to Azure Blob Storage container "contributions"
    return _json({"ok": True, "stored": False, "note": "storage not wired yet"})
