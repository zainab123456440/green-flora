"""
assistant.py (schemas)

Request/response shapes for the Green Flora AI Assistant endpoints.
The chat endpoint streams Server-Sent Events rather than returning a
single JSON body, so its payload shapes live in the service layer
(services/assistant_service.py) instead of here.
"""

from pydantic import BaseModel, Field
from typing import Literal, Optional


class ChatMessageIn(BaseModel):
    """One turn of the conversation sent from the client."""

    role: Literal["user", "assistant"]
    content: str = Field(..., min_length=1, max_length=4000)


class ChatRequest(BaseModel):
    """POST /api/assistant/chat body."""

    messages: list[ChatMessageIn] = Field(
        ..., min_length=1, max_length=60,
        description="Conversation history (newest message last).",
    )
    voice: bool = Field(
        default=False,
        description="True when the newest message arrived via speech.",
    )


class TranscriptionResponse(BaseModel):
    """POST /api/assistant/transcribe response."""

    text: str


class TTSRequest(BaseModel):
    """POST /api/assistant/speak body."""

    text: str = Field(..., min_length=1, max_length=3000)
    voice: Optional[str] = Field(
        default="alloy",
        description="TTS voice (alloy, echo, fable, onyx, nova, shimmer).",
    )


class GreetingResponse(BaseModel):
    """GET /api/assistant/greeting response."""

    greeting: str
    language: Literal["en", "ur"]
    time_of_day: Literal["morning", "afternoon", "evening"]
