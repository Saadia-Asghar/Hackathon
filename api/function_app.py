"""SignBridge API (Azure Functions, Python v2 model). Keys come from app settings, never the browser."""
from __future__ import annotations

import json
import os

import logging
import re
import uuid
from pathlib import Path
from xml.sax.saxutils import escape

import azure.functions as func
import numpy as np
import onnxruntime as ort
import requests
from azure.storage.blob import BlobServiceClient
from openai import AzureOpenAI

LANGS = {"psl", "sgsl", "asl"}
SAFE_NAME = re.compile(r"[a-z0-9_]{1,40}")

app = func.FunctionApp(http_auth_level=func.AuthLevel.ANONYMOUS)

MAX_GLOSS = 40


def _openai() -> AzureOpenAI:
    return AzureOpenAI(
        azure_endpoint=os.environ["AZURE_OPENAI_ENDPOINT"],
        api_key=os.environ["AZURE_OPENAI_KEY"],
        api_version=os.environ.get("AZURE_OPENAI_API_VERSION", "2024-10-21"),
    )


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

    resp = _openai().chat.completions.create(
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


@app.route(route="translate", methods=["POST"])
def translate(req: func.HttpRequest) -> func.HttpResponse:
    """A5: {text, to} -> Azure AI Translator. `to` e.g. ur, ms, zh-Hans, ta, ar."""
    try:
        data = req.get_json()
        text = str(data.get("text", ""))[:2000]
        to = str(data.get("to", "ur"))[:10]
    except ValueError:
        return _json({"error": "invalid JSON"}, 400)
    if not text:
        return _json({"error": "text is empty"}, 400)
    r = requests.post(
        "https://api.cognitive.microsofttranslator.com/translate",
        params={"api-version": "3.0", "to": to},
        headers={
            "Ocp-Apim-Subscription-Key": os.environ["AZURE_TRANSLATOR_KEY"],
            "Ocp-Apim-Subscription-Region": os.environ["AZURE_TRANSLATOR_REGION"],
            "Content-Type": "application/json",
        },
        json=[{"text": text}],
        timeout=15,
    )
    if not r.ok:
        return _json({"error": "translator failed"}, 502)
    return _json({"text": r.json()[0]["translations"][0]["text"]})


@app.route(route="tts", methods=["POST"])
def tts(req: func.HttpRequest) -> func.HttpResponse:
    """A5: {text, voice} -> MP3 from Azure AI Speech. voice e.g. ur-PK-UzmaNeural, en-SG-LunaNeural."""
    try:
        data = req.get_json()
        text = str(data.get("text", ""))[:1000]
        voice = str(data.get("voice", "en-US-JennyNeural"))[:60]
    except ValueError:
        return _json({"error": "invalid JSON"}, 400)
    if not text:
        return _json({"error": "text is empty"}, 400)
    lang = "-".join(voice.split("-")[:2])
    ssml = (
        f"<speak version='1.0' xml:lang='{escape(lang)}'><voice name='{escape(voice)}'>"
        f"{escape(text)}</voice></speak>"
    )
    region = os.environ["AZURE_SPEECH_REGION"]
    r = requests.post(
        f"https://{region}.tts.speech.microsoft.com/cognitiveservices/v1",
        headers={
            "Ocp-Apim-Subscription-Key": os.environ["AZURE_SPEECH_KEY"],
            "Content-Type": "application/ssml+xml",
            "X-Microsoft-OutputFormat": "audio-16khz-32kbitrate-mono-mp3",
        },
        data=ssml.encode("utf-8"),
        timeout=20,
    )
    if not r.ok:
        return _json({"error": "speech failed"}, 502)
    return func.HttpResponse(r.content, mimetype="audio/mpeg")


@app.route(route="ocr", methods=["POST"])
def ocr(req: func.HttpRequest) -> func.HttpResponse:
    """C4: image bytes (body) -> text via Azure AI Vision, then plain-language summary via Azure OpenAI."""
    image = req.get_body()
    if not image or len(image) > 8 * 1024 * 1024:
        return _json({"error": "send an image up to 8 MB as the request body"}, 400)
    endpoint = os.environ["AZURE_VISION_ENDPOINT"].rstrip("/")
    r = requests.post(
        f"{endpoint}/computervision/imageanalysis:analyze",
        params={"api-version": "2024-02-01", "features": "read"},
        headers={"Ocp-Apim-Subscription-Key": os.environ["AZURE_VISION_KEY"], "Content-Type": "application/octet-stream"},
        data=image,
        timeout=30,
    )
    if not r.ok:
        return _json({"error": "vision failed"}, 502)
    blocks = r.json().get("readResult", {}).get("blocks", [])
    text = "\n".join(line["text"] for b in blocks for line in b.get("lines", []))
    if not text:
        return _json({"text": "", "simple": ""})
    resp = _openai().chat.completions.create(
        model=os.environ["AZURE_OPENAI_DEPLOYMENT"],
        temperature=0.2,
        max_tokens=200,
        messages=[
            {"role": "system", "content": "Rewrite this document in very simple English (max 5 short sentences) for a deaf reader. Keep dates, amounts and actions. Do not invent anything."},
            {"role": "user", "content": text[:6000]},
        ],
    )
    return _json({"text": text, "simple": resp.choices[0].message.content.strip()})


@app.route(route="contribute", methods=["POST"])
def contribute(req: func.HttpRequest) -> func.HttpResponse:
    """C1: validate a landmark clip [30][177] + consent, then save to Blob container "contributions"."""
    try:
        data = req.get_json()
    except ValueError:
        return _json({"error": "invalid JSON"}, 400)
    clip = data.get("clip")
    if data.get("consent") is not True:
        return _json({"error": "consent required"}, 400)
    if not (isinstance(clip, list) and len(clip) == 30 and all(isinstance(f, list) and len(f) == 177 for f in clip)):
        return _json({"error": "clip must be 30 x 177 numbers"}, 400)
    lang = str(data.get("lang", ""))
    label = str(data.get("label", ""))
    if lang not in LANGS or not SAFE_NAME.fullmatch(label):
        return _json({"error": "bad lang or label"}, 400)
    conn = os.environ.get("AZURE_STORAGE_CONNECTION_STRING")
    if not conn:
        return _json({"ok": True, "stored": False, "note": "storage not configured"})
    blob_name = f"{lang}/{label}/{uuid.uuid4().hex}.json"
    record = {"lang": lang, "label": label, "clip": clip, "consent": True, "at": str(data.get("at", ""))[:40], "status": "pending"}
    BlobServiceClient.from_connection_string(conn).get_blob_client("contributions", blob_name).upload_blob(json.dumps(record))
    return _json({"ok": True, "stored": True, "id": blob_name})


# ---------- D4: Developer API (landmarks only, never video) ----------
_sessions: dict[str, tuple[ort.InferenceSession, list[str]]] = {}


def _model(lang: str):
    if lang not in _sessions:
        folder = Path(os.environ.get("SIGNBRIDGE_MODEL_DIR", Path(__file__).parent / "models"))
        labels = json.loads((folder / f"{lang}.labels.json").read_text(encoding="utf-8"))["labels"]
        _sessions[lang] = (ort.InferenceSession(str(folder / f"{lang}.onnx")), labels)
    return _sessions[lang]


@app.route(route="v1/recognize", methods=["POST"])
def recognize(req: func.HttpRequest) -> func.HttpResponse:
    """{lang, clip[30][177]} + header x-api-key -> {label, confidence}. Keys: env SIGNBRIDGE_API_KEYS (comma separated)."""
    keys = {k.strip() for k in os.environ.get("SIGNBRIDGE_API_KEYS", "").split(",") if k.strip()}
    if not keys or req.headers.get("x-api-key") not in keys:
        return _json({"error": "invalid API key"}, 401)
    try:
        data = req.get_json()
    except ValueError:
        return _json({"error": "invalid JSON"}, 400)
    lang, clip = data.get("lang"), data.get("clip")
    if lang not in LANGS:
        return _json({"error": "lang must be psl, sgsl or asl"}, 400)
    if not (isinstance(clip, list) and len(clip) == 30 and all(isinstance(f, list) and len(f) == 177 for f in clip)):
        return _json({"error": "clip must be 30 x 177 numbers"}, 400)
    try:
        session, labels = _model(lang)
    except FileNotFoundError:
        return _json({"error": f"no model deployed for {lang}"}, 503)
    logits = session.run(["logits"], {"input": np.asarray([clip], dtype=np.float32)})[0][0]
    probs = np.exp(logits - logits.max())
    probs /= probs.sum()
    best = int(probs.argmax())
    logging.info("recognize lang=%s key=%s", lang, req.headers.get("x-api-key", "")[:4])  # usage metering
    return _json({"label": labels[best], "confidence": round(float(probs[best]), 4)})
