"""
routes/assistant.py

API endpoints for the Green Flora AI Assistant.

Routes stay thin: they validate input (via schemas), resolve the
authenticated user, and delegate to ``services/assistant_service.py``.
All AI provider logic, fallbacks, and keys live server-side in the
service layer — never in the browser.

Authentication model (mirrors routes/farmer.py):
  * DEMO_MODE=true  + no token → demo farmer context.
  * DEMO_MODE=false + no token → 401 (auth required).
  * valid token     → the farmer's real profile context.

Endpoints:
    POST /api/assistant/chat       -> SSE stream of the AI answer
    POST /api/assistant/transcribe -> speech-to-text (multipart audio)
    POST /api/assistant/speak      -> text-to-speech (MP3 audio)
    GET  /api/assistant/greeting   -> localized dashboard greeting
"""

import json
import logging

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import Response, StreamingResponse

from config.settings import settings
from dependencies.auth import get_optional_user
from schemas.assistant import (
    ChatRequest,
    GreetingResponse,
    TranscriptionResponse,
    TTSRequest,
)
from services.assistant_service import AssistantError, assistant_service
from services.farmer_service import farmer_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/assistant", tags=["assistant"])


def _resolve_user_id(user: dict | None) -> str | None:
    """Authenticated user_id, or None in demo mode; 401 in live mode."""
    if settings.demo_mode:
        return None
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Please sign in to use the Green Flora AI assistant.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user["user_id"]


def _sse_event(event: dict) -> str:
    """Format one assistant event as a Server-Sent Events frame."""
    payload = json.dumps(event, ensure_ascii=False, default=str)
    return f"event: {event.get('type', 'message')}\ndata: {payload}\n\n"


# ---------------------------------------------------------------------------
# Chat (streaming)
# ---------------------------------------------------------------------------

@router.post("/chat")
def chat(
    request: ChatRequest,
    user: dict | None = Depends(get_optional_user),
) -> StreamingResponse:
    """
    Stream an assistant reply as Server-Sent Events:

        event: status  data: {"state": "thinking"|"searching"|"tool"|...}
        event: delta   data: {"text": "..."}   (answer text chunk)
        event: done    data: {"provider": "openai"|"gemini", ...}
        event: error   data: {"message": "...", "retryable": true}
    """
    user_id = _resolve_user_id(user)

    def event_stream():
        try:
            for event in assistant_service.chat_stream(
                user_id,
                [m.model_dump() for m in request.messages],
                voice=request.voice,
            ):
                yield _sse_event(event)
        except Exception:
            # The service layer handles its own friendly errors; this is
            # a last-resort guard so the stream always ends cleanly.
            logger.exception("Assistant chat stream failed unexpectedly")
            yield _sse_event({
                "type": "error",
                "message": (
                    "Green Flora AI could not answer right now. "
                    "Please try again."
                ),
                "retryable": True,
            })

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # disable proxy buffering
        },
    )


# ---------------------------------------------------------------------------
# Speech-to-text
# ---------------------------------------------------------------------------

@router.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe(
    file: UploadFile = File(..., description="Recorded audio (webm/mp3/mp4/wav)."),
    user: dict | None = Depends(get_optional_user),
) -> TranscriptionResponse:
    """Transcribe farmer speech (Urdu / English / mixed) to text."""
    _resolve_user_id(user)

    audio_bytes = await file.read()
    try:
        text = assistant_service.transcribe(
            audio_bytes,
            filename=file.filename or "",
            content_type=file.content_type or "",
        )
    except AssistantError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except Exception as exc:
        logger.exception("Transcription endpoint failed")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Voice transcription is temporarily unavailable.",
        ) from exc

    return TranscriptionResponse(text=text)


# ---------------------------------------------------------------------------
# Text-to-speech
# ---------------------------------------------------------------------------

@router.post("/speak")
def speak(
    request: TTSRequest,
    user: dict | None = Depends(get_optional_user),
) -> Response:
    """Read *text* aloud as MP3 audio (gpt-4o-mini-tts)."""
    _resolve_user_id(user)

    try:
        audio = assistant_service.speak(request.text, request.voice or "alloy")
    except AssistantError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except Exception as exc:
        logger.exception("TTS endpoint failed")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Voice replies are temporarily unavailable.",
        ) from exc

    return Response(
        content=audio,
        media_type="audio/mpeg",
        headers={"Cache-Control": "no-store"},
    )


# ---------------------------------------------------------------------------
# Dashboard greeting
# ---------------------------------------------------------------------------

@router.get("/greeting", response_model=GreetingResponse)
def greeting(
    user: dict | None = Depends(get_optional_user),
) -> GreetingResponse:
    """Short, localized, time-of-day greeting for the dashboard hero."""
    user_id = _resolve_user_id(user)

    farmer_name, preferred_language = "", "en"
    try:
        farmer = farmer_service.get_farmer(user_id)
        if farmer:
            farmer_name = farmer.name
            preferred_language = farmer.preferred_language or "en"
    except Exception as exc:
        logger.warning("Greeting could not load farmer profile: %s", exc)

    try:
        return GreetingResponse(**assistant_service.greeting(
            farmer_name, preferred_language
        ))
    except Exception as exc:
        logger.exception("Greeting endpoint failed")
        # Never break the dashboard over a greeting.
        return GreetingResponse(
            greeting="Assalam-o-Alaikum! How can Green Flora help your farm today?",
            language="en",
            time_of_day="morning",
        )
