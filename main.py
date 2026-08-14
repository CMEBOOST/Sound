from __future__ import annotations

import re
import uuid
from functools import lru_cache
from pathlib import Path

import edge_tts
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel, Field
from starlette.requests import Request


BASE_DIR = Path(__file__).resolve().parent
TEMPLATES_DIR = BASE_DIR / "templates"
STATIC_DIR = BASE_DIR / "static"
GENERATED_DIR = BASE_DIR / "generated"

GENERATED_DIR.mkdir(exist_ok=True)

app = FastAPI(title="Sound Studio", version="1.0.0")
templates = Jinja2Templates(directory=str(TEMPLATES_DIR))
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


class TTSRequest(BaseModel):
	text: str = Field(min_length=1, max_length=5000)
	voice: str = Field(min_length=1, max_length=128)
	rate: str = Field(default="+0%", max_length=16)
	pitch: str = Field(default="+0Hz", max_length=16)
	volume: str = Field(default="+0%", max_length=16)


def _sanitize_filename(value: str) -> str:
	value = re.sub(r"[^A-Za-z0-9._-]+", "_", value).strip("._-")
	return value or "sound"


def _normalize_effect(value: str, suffix: str) -> str:
	cleaned_value = str(value).strip()
	if cleaned_value in {f"0{suffix}", f"+0{suffix}", f"-0{suffix}"}:
		return f"+0{suffix}"
	if cleaned_value and cleaned_value[0] not in "+-":
		return f"+{cleaned_value}"
	return cleaned_value or f"+0{suffix}"


@lru_cache(maxsize=1)
def _fallback_voices() -> list[dict[str, str]]:
	return [
		{"Name": "th-TH-NiwatNeural", "ShortName": "th-TH-NiwatNeural", "Gender": "Male", "Locale": "th-TH"},
		{"Name": "th-TH-PremwadeeNeural", "ShortName": "th-TH-PremwadeeNeural", "Gender": "Female", "Locale": "th-TH"},
		{"Name": "en-US-AriaNeural", "ShortName": "en-US-AriaNeural", "Gender": "Female", "Locale": "en-US"},
		{"Name": "en-US-GuyNeural", "ShortName": "en-US-GuyNeural", "Gender": "Male", "Locale": "en-US"},
	]


async def _load_voices() -> list[dict[str, str]]:
	try:
		voices = await edge_tts.list_voices()
	except Exception:
		return _fallback_voices()

	cleaned = []
	for voice in voices:
		cleaned.append(
			{
				"Name": voice.get("FriendlyName") or voice.get("Name") or voice.get("ShortName", "Unknown"),
				"ShortName": voice.get("ShortName", ""),
				"Gender": voice.get("Gender", ""),
				"Locale": voice.get("Locale", ""),
			}
		)

	cleaned.sort(key=lambda item: (item["Locale"], item["Gender"], item["Name"]))
	return cleaned or _fallback_voices()


@app.get("/", response_class=HTMLResponse)
async def index(request: Request) -> HTMLResponse:
	return templates.TemplateResponse(
		request=request,
		name="index.html",
		context={"title": "Sound Studio"},
	)


@app.get("/api/voices")
async def voices() -> JSONResponse:
	return JSONResponse({"voices": await _load_voices()})


@app.post("/api/tts")
async def create_tts(payload: TTSRequest) -> JSONResponse:
	output_name = f"tts_{uuid.uuid4().hex}.mp3"
	output_path = GENERATED_DIR / output_name
	rate = _normalize_effect(payload.rate, "%")
	pitch = _normalize_effect(payload.pitch, "Hz")
	volume = _normalize_effect(payload.volume, "%")

	try:
		communicator = edge_tts.Communicate(
			text=payload.text.strip(),
			voice=payload.voice,
			rate=rate,
			pitch=pitch,
			volume=volume,
		)
		await communicator.save(str(output_path))
	except Exception as exc:  # pragma: no cover - runtime/network dependent
		raise HTTPException(status_code=500, detail=f"สร้างไฟล์เสียงไม่สำเร็จ: {exc}") from exc

	file_url = f"/downloads/{output_name}"
	return JSONResponse(
		{
			"message": "สร้างไฟล์เสียงสำเร็จ",
			"filename": output_name,
			"download_url": file_url,
			"preview_url": file_url,
		}
	)


@app.get("/downloads/{filename}")
async def download_file(filename: str):
	safe_name = _sanitize_filename(filename)
	file_path = GENERATED_DIR / safe_name
	if not file_path.exists():
		raise HTTPException(status_code=404, detail="ไม่พบไฟล์เสียง")

	return FileResponse(
		path=str(file_path),
		filename=safe_name,
		media_type="audio/mpeg",
	)


@app.get("/health")
async def health() -> JSONResponse:
	return JSONResponse({"status": "ok"})


def main() -> None:
	import uvicorn

	uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)


if __name__ == "__main__":
	main()