"""
services/assistant_service.py

Central AI orchestration for the Green Flora Assistant.

Provider strategy (project task spec):
  - PRIMARY: OpenAI ``gpt-5.6-luna`` via the Responses API — chosen
    because this model only supports function tools on /v1/responses.
    The hosted ``web_search`` tool is enabled alongside Green Flora's
    internal function tools, so the model can research the web only
    when internal data is insufficient.
  - FALLBACK: Gemini Flash via the google-genai SDK.  Used ONLY when
    OpenAI fails with a transient problem (timeout / rate limit /
    5xx).  Never called in parallel with OpenAI.
  - UTILITY: ``gpt-4o-mini`` for cheap jobs — the dashboard greeting
    and entity extraction of voice input (structured outputs).

Speech layer (kept modular so providers can be swapped later):
  - Speech-to-text: ``gpt-4o-mini-transcribe`` (Urdu/English/mixed).
  - Text-to-speech: ``gpt-4o-mini-tts``.

The public chat API is a generator of SSE-friendly event dicts:
  {"type": "status", ...}   thinking / searching / tool progress
  {"type": "delta", ...}    streamed answer text
  {"type": "done", ...}     final metadata (provider, tools used)
  {"type": "error", ...}    friendly, retryable failure

Data integrity: the model receives explicit instructions to never
invent weather/prices/products, and every tool returns honest
"unavailable" payloads instead of fabricated values.
"""

import io
import json
import logging
import re
from datetime import datetime, timedelta, timezone
from typing import Any, Generator, Optional

import openai

from config.settings import settings
from services import assistant_tools

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Tunables
# ---------------------------------------------------------------------------

_MAX_TOOL_HOPS = 4            # max tool-call rounds before forcing an answer
_MAX_HISTORY_MESSAGES = 16    # context limit sent to the model
_MAX_MESSAGE_CHARS = 4000     # per-message character cap
_MAX_TRANSCRIBE_BYTES = 15 * 1024 * 1024   # 15 MB audio cap
_MAX_TTS_CHARS = 3000
_GREETING_CACHE_TTL = 600     # seconds

# Voice-input status labels (also surfaced to the UI).
_TOOL_LABELS: dict[str, str] = {
    "get_weather": "Checking the weather for your farm",
    "get_crop_market_data": "Checking today's market prices",
    "search_agricultural_products": "Searching agricultural products",
}

_TTS_INSTRUCTIONS = (
    "Speak like a warm, trusted farming advisor: clear, calm and "
    "unhurried. Keep the exact language and script of the text. "
    "Numbers and prices must be easy to follow."
)

_TTS_VOICES = {"alloy", "echo", "fable", "onyx", "nova", "shimmer"}

# Pakistan Standard Time — fixed UTC+5, no daylight saving. A fixed
# offset avoids the tzdata dependency on Windows hosts.
_PKST = timezone(timedelta(hours=5))


def _now_karachi() -> datetime:
    return datetime.now(_PKST)

# Hardcoded fallbacks so the greeting works even when the AI providers
# are unreachable (never blocks the dashboard).
_GREETING_FALLBACKS = {
    ("en", "morning"): "Good morning! How can Green Flora help your farm today?",
    ("en", "afternoon"): "Good afternoon! How can Green Flora help your farm today?",
    ("en", "evening"): "Good evening! How can Green Flora help your farm today?",
    ("ur", "morning"): "صبح بخیر! آج گرین فلورا آپ کے کھیت کی کیسے مدد کرے؟",
    ("ur", "afternoon"): "السلام علیکم! آج گرین فلورا آپ کے کھیت کی کیسے مدد کرے؟",
    ("ur", "evening"): "شام بخیر! آج گرین فلورا آپ کے کھیت کی کیسے مدد کرے؟",
}


class AssistantError(Exception):
    """Raised with a farmer-friendly message for the API layer."""


class _TransientAIError(Exception):
    """OpenAI failed temporarily — the caller may try the Gemini fallback."""


def _sse_ready(event: dict) -> dict:
    """Ensure an event dict is JSON-serialisable (never leaks internals)."""
    return json.loads(json.dumps(event, ensure_ascii=False, default=str))


class AssistantService:
    """Green Flora AI assistant — single, centralised orchestrator."""

    def __init__(self) -> None:
        # OpenAI client (primary provider + speech layer).
        self._openai: Optional[openai.OpenAI] = None
        if settings.openai_api_key:
            self._openai = openai.OpenAI(api_key=settings.openai_api_key)

        # Gemini client (fallback provider). Uses the modern google-genai
        # SDK, which supports Google Search grounding alongside function
        # calling. The Crop Doctor keeps the legacy SDK — untouched.
        self._gemini = None
        if settings.gemini_api_key:
            try:
                from google import genai as genai_sdk
                self._gemini = genai_sdk.Client(api_key=settings.gemini_api_key)
            except Exception as exc:  # SDK problems must not break the app
                logger.warning("Gemini fallback unavailable: %s", exc)

        # (key, timestamp, value) greeting cache.
        self._greeting_cache: dict[str, tuple[float, str]] = {}

    def _sanitize_link_stream(self, generator: Generator[dict, None, None]) -> Generator[dict, None, None]:
        """
        Intercepts the SSE event stream and forcefully strips Markdown links 
        [Text](URL) and citation markers from text deltas, properly handling chunks 
        split mid-link.
        """
        buffer = ""
        # Matches: [text](url) OR ([text](url)) OR 【citation】 with optional leading spaces
        link_regex = re.compile(r'\s*(?:\(?\[[^\]]+\]\([^)]+\)\)?|【[^】]+】)')
        
        for event in generator:
            if event.get("type") == "delta":
                buffer += event.get("text", "")
                
                # If there's an open bracket/parenthesis, we might be mid-link. 
                # Hold the stream until it finishes writing the link.
                if "[" in buffer or "【" in buffer:
                    # Clean fully formed links currently in the buffer
                    buffer = link_regex.sub("", buffer)
                    
                    # Check if a link/citation is still incomplete
                    last_open_bracket = max(buffer.rfind("["), buffer.rfind("【"))
                    last_close_paren = max(buffer.rfind(")"), buffer.rfind("】"))
                    
                    # If we have an open bracket but haven't closed it yet,
                    # swallow this chunk and wait for the rest of the URL to stream in.
                    if last_open_bracket > last_close_paren:
                        continue
                
                # If the buffer has safe text, emit it and clear the buffer
                if buffer:
                    yield _sse_ready({"type": "delta", "text": buffer})
                    buffer = ""
            else:
                yield event
                
        # Yield any remaining text when the stream finishes
        if buffer:
            buffer = link_regex.sub("", buffer)
            if buffer:
                yield _sse_ready({"type": "delta", "text": buffer})

    # ==================================================================
    # Public: chat (streaming)
    # ==================================================================

    def chat_stream(
        self,
        user_id: Optional[str],
        messages: list[dict],
        voice: bool = False,
    ) -> Generator[dict, None, None]:
        """
        Stream an assistant reply for *messages* (list of
        ``{"role": "user"|"assistant", "content": str}``).

        Yields SSE-ready event dicts. Never raises — failures surface as
        ``{"type": "error"}`` events so the UI can offer a retry.
        """
        if not self._openai and not self._gemini:
            yield {
                "type": "error",
                "message": "The Green Flora AI assistant is not configured yet.",
                "retryable": False,
            }
            return

        conversation = self._sanitize_messages(messages)
        if not conversation:
            yield {
                "type": "error",
                "message": "Please type your question first.",
                "retryable": False,
            }
            return

        # Farmer context: loaded once, shared by the prompt and the tools.
        snapshot = assistant_tools.load_farmer_snapshot(user_id)
        farmer = snapshot.get("farmer")
        system_prompt = self._build_system_prompt(snapshot)

        # Voice input: run the cheap entity extraction to help the main
        # model with transcription noise (GPT-4o Mini, structured output).
        if voice:
            last_user = next(
                (m["content"] for m in reversed(conversation)
                 if m["role"] == "user"),
                "",
            )
            entities = self._extract_entities_safe(last_user)
            if entities:
                system_prompt += self._render_entity_notes(entities)

        state: dict = {
            "emitted_text": False,
            "tools_used": [],
            "web_search": False,
        }

        # ---- Primary provider: OpenAI (streaming) --------------------
        if self._openai:
            try:
                yield from self._sanitize_link_stream(
                    self._run_openai(system_prompt, conversation, farmer, state)
                )
                return
            except _TransientAIError as exc:
                if state["emitted_text"]:
                    # Half an answer is already on screen — do not restart
                    # with another provider mid-sentence.
                    logger.warning("OpenAI stream dropped mid-answer: %s", exc)
                    yield {
                        "type": "error",
                        "message": "The answer was interrupted. Please ask again.",
                        "retryable": True,
                    }
                    return
                logger.warning("OpenAI transient failure, trying Gemini: %s", exc)
                if self._gemini:
                    yield {
                        "type": "status",
                        "state": "connecting_backup",
                        "label": "Connecting to the backup AI",
                    }
            except Exception:
                logger.exception("Unexpected OpenAI assistant failure")
                yield {
                    "type": "error",
                    "message": (
                        "Green Flora AI could not answer right now. "
                        "Please try again."
                    ),
                    "retryable": True,
                }
                return

        # ---- Fallback provider: Gemini -------------------------------
        if self._gemini:
            try:
                yield from self._sanitize_link_stream(
                    self._run_gemini(system_prompt, conversation, farmer, state)
                )
            except Exception as exc:
                logger.warning("Gemini fallback failed: %s", exc)
                yield {
                    "type": "error",
                    "message": (
                        "Green Flora AI is very busy right now. "
                        "Please try again in a moment."
                    ),
                    "retryable": True,
                }
            return

        yield {
            "type": "error",
            "message": "Green Flora AI is very busy right now. Please try again.",
            "retryable": True,
        }

    # ==================================================================
    # OpenAI runner (Responses API, streaming)
    # ==================================================================

    def _run_openai(
        self,
        system_prompt: str,
        conversation: list[dict],
        farmer: Any,
        state: dict,
    ) -> Generator[dict, None, None]:
        tools_payload: list[dict] = [
            {
                "type": "function",
                "name": d["name"],
                "description": d["description"],
                "parameters": d["parameters"],
            }
            for d in assistant_tools.TOOL_DEFINITIONS
        ] + [{"type": "web_search"}]

        conv = list(conversation)

        for hop in range(_MAX_TOOL_HOPS):
            yield {"type": "status", "state": "thinking", "label": "Green Flora AI is thinking"}

            function_calls = []
            try:
                stream = self._openai.responses.create(
                    model=settings.ai_main_model,
                    instructions=system_prompt,
                    input=conv,
                    tools=tools_payload,
                    stream=True,
                    timeout=settings.ai_stream_timeout_seconds,
                )
                for event in stream:
                    etype = getattr(event, "type", "")
                    if etype == "response.output_text.delta":
                        state["emitted_text"] = True
                        yield _sse_ready({"type": "delta", "text": event.delta})
                    elif etype == "response.output_item.added":
                        item = getattr(event, "item", None)
                        if getattr(item, "type", "") == "web_search_call":
                            state["web_search"] = True
                            yield {
                                "type": "status",
                                "state": "searching",
                                "label": "Searching the web",
                            }
                    elif etype == "response.output_item.done":
                        item = getattr(event, "item", None)
                        if getattr(item, "type", "") == "function_call":
                            function_calls.append(item)
                    elif etype in ("response.failed", "response.incomplete"):
                        raise _TransientAIError("model returned an incomplete response")
            except _TransientAIError:
                raise
            except openai.APITimeoutError as exc:
                raise _TransientAIError("timeout") from exc
            except openai.APIConnectionError as exc:
                raise _TransientAIError("connection") from exc
            except openai.RateLimitError as exc:
                raise _TransientAIError("rate limit") from exc
            except openai.InternalServerError as exc:
                raise _TransientAIError("server error") from exc
            except openai.APIStatusError as exc:
                if exc.status_code and exc.status_code >= 500:
                    raise _TransientAIError(f"status {exc.status_code}") from exc
                # 4xx = our request is wrong; retrying elsewhere rarely helps.
                logger.error("OpenAI API rejected the request: %s", exc)
                raise AssistantError(
                    "Green Flora AI could not process that question."
                ) from exc
            except Exception as exc:
                # httpx ReadTimeout etc. mid-stream — still transient.
                if "timed out" in str(exc).lower() or "timeout" in str(exc).lower():
                    raise _TransientAIError("read timeout") from exc
                raise

            if not function_calls:
                # The answer has already been streamed out.
                if not state["emitted_text"]:
                    yield _sse_ready({"type": "delta", "text": ""})
                yield _sse_ready({
                    "type": "done",
                    "provider": "openai",
                    "tools_used": state["tools_used"],
                    "web_search": state["web_search"],
                })
                return

            # Execute every requested tool and feed results back.
            for call in function_calls:
                conv.append({
                    "type": "function_call",
                    "call_id": call.call_id,
                    "name": call.name,
                    "arguments": call.arguments,
                })
                state["tools_used"].append(call.name)
                yield {
                    "type": "status",
                    "state": "tool",
                    "tool": call.name,
                    "label": _TOOL_LABELS.get(call.name, "Checking Green Flora data"),
                }
                result = self._execute_tool(call.name, call.arguments, farmer)
                conv.append({
                    "type": "function_call_output",
                    "call_id": call.call_id,
                    "output": json.dumps(result, ensure_ascii=False, default=str),
                })

        # Tool budget exhausted — answer without tools to stay responsive.
        yield {"type": "status", "state": "thinking", "label": "Green Flora AI is thinking"}
        stream = self._openai.responses.create(
            model=settings.ai_main_model,
            instructions=(
                system_prompt
                + "\n\nNote: the tool budget for this answer is used up. "
                "Answer directly from the data already gathered above."
            ),
            input=conv,
            stream=True,
            timeout=settings.ai_stream_timeout_seconds,
        )
        for event in stream:
            if getattr(event, "type", "") == "response.output_text.delta":
                state["emitted_text"] = True
                yield _sse_ready({"type": "delta", "text": event.delta})
        yield _sse_ready({
            "type": "done",
            "provider": "openai",
            "tools_used": state["tools_used"],
            "web_search": state["web_search"],
        })

    # ==================================================================
    # Gemini runner (fallback, non-streaming)
    # ==================================================================

    def _run_gemini(
        self,
        system_prompt: str,
        conversation: list[dict],
        farmer: Any,
        state: dict,
    ) -> Generator[dict, None, None]:
        from google.genai import types as genai_types

        contents: list[Any] = [
            genai_types.Content(
                role="user" if m["role"] == "user" else "model",
                parts=[genai_types.Part(text=m["content"])],
            )
            for m in conversation
        ]

        fn_decls = [
            genai_types.FunctionDeclaration(
                name=d["name"],
                description=d["description"],
                parameters=d["parameters"],
            )
            for d in assistant_tools.TOOL_DEFINITIONS
        ]

        # Google Search grounding + function calling. If the model rejects
        # the combination we degrade to data tools only.
        tools: list[Any] = [
            genai_types.Tool(function_declarations=fn_decls),
            genai_types.Tool(google_search=genai_types.GoogleSearch()),
        ]

        for hop in range(_MAX_TOOL_HOPS):
            yield {"type": "status", "state": "thinking", "label": "Green Flora AI is thinking"}
            try:
                resp = self._gemini.models.generate_content(
                    model=settings.ai_fallback_model,
                    contents=contents,
                    config=genai_types.GenerateContentConfig(
                        system_instruction=system_prompt,
                        tools=tools,
                    ),
                )
            except Exception as exc:
                if len(tools) > 1 and self._is_search_combo_error(exc):
                    logger.warning(
                        "Gemini rejected search + function tools; "
                        "retrying with data tools only."
                    )
                    tools = [tools[0]]
                    continue
                raise

            candidates = getattr(resp, "candidates", None) or []
            if not candidates:
                raise AssistantError("The backup AI returned an empty answer.")
            parts = getattr(candidates[0].content, "parts", None) or []

            # Grounded answers carry grounding metadata.
            if getattr(candidates[0], "grounding_metadata", None):
                state["web_search"] = True

            fn_calls = [p.function_call for p in parts if getattr(p, "function_call", None)]
            if fn_calls:
                contents.append(
                    genai_types.Content(
                        role="model",
                        parts=[
                            genai_types.Part(function_call=fc) for fc in fn_calls
                        ],
                    )
                )
                for fc in fn_calls:
                    name = fc.name
                    args = dict(fc.args or {})
                    state["tools_used"].append(name)
                    yield {
                        "type": "status",
                        "state": "tool",
                        "tool": name,
                        "label": _TOOL_LABELS.get(name, "Checking Green Flora data"),
                    }
                    result = self._execute_tool(name, json.dumps(args), farmer)
                    contents.append(
                        genai_types.Content(
                            role="user",
                            parts=[
                                genai_types.Part(
                                    function_response=genai_types.FunctionResponse(
                                        name=name, response=result
                                    )
                                )
                            ],
                        )
                    )
                continue

            text = "".join(p.text or "" for p in parts)
            state["emitted_text"] = True
            yield _sse_ready({"type": "delta", "text": text})
            yield _sse_ready({
                "type": "done",
                "provider": "gemini",
                "tools_used": state["tools_used"],
                "web_search": state["web_search"],
            })
            return

        raise AssistantError("The backup AI used up its tool budget.")

    @staticmethod
    def _is_search_combo_error(exc: Exception) -> bool:
        msg = str(exc).lower()
        return (
            "google_search" in msg
            or "search grounding" in msg
            or "simultaneously" in msg
            or ("not supported" in msg and "tool" in msg)
        )

    # ==================================================================
    # Tool execution (shared by both providers)
    # ==================================================================

    def _execute_tool(self, name: str, arguments_json: str, farmer: Any) -> dict:
        try:
            args = json.loads(arguments_json or "{}")
            if not isinstance(args, dict):
                args = {}
        except json.JSONDecodeError:
            args = {}

        try:
            if name == "get_weather":
                return assistant_tools.get_weather(
                    place=args.get("place") or None,
                    farm_latitude=getattr(farmer, "farm_latitude", None),
                    farm_longitude=getattr(farmer, "farm_longitude", None),
                )
            if name == "get_crop_market_data":
                return assistant_tools.get_crop_market_data(
                    crop=str(args.get("crop") or "")
                )
            if name == "search_agricultural_products":
                return assistant_tools.search_agricultural_products(
                    query=str(args.get("query") or "")
                )
            return {"error": f"Unknown tool '{name}'."}
        except Exception:
            logger.exception("Tool '%s' failed", name)
            return {
                "available": False,
                "message": "Green Flora data could not be retrieved for this request.",
            }

    # ==================================================================
    # Speech: transcription + text-to-speech
    # ==================================================================

    def transcribe(self, audio_bytes: bytes, filename: str, content_type: str) -> str:
        """
        Transcribe farmer speech (Urdu / English / mixed) with
        ``gpt-4o-mini-transcribe``.
        """
        if not self._openai:
            raise AssistantError("Voice transcription is not configured.")

        if len(audio_bytes) == 0:
            raise AssistantError("No speech was recorded. Please try again.")
        if len(audio_bytes) > _MAX_TRANSCRIBE_BYTES:
            raise AssistantError(
                "That recording is too long. Please keep it under a minute."
            )

        mime = (content_type or "").split(";")[0].strip().lower()
        if not mime or mime == "application/octet-stream":
            ext = (filename or "").rsplit(".", 1)[-1].lower()
            mime = {
                "webm": "audio/webm", "mp3": "audio/mpeg", "m4a": "audio/mp4",
                "mp4": "audio/mp4", "wav": "audio/wav", "ogg": "audio/ogg",
            }.get(ext, "audio/webm")

        try:
            result = self._openai.audio.transcriptions.create(
                model=settings.ai_transcribe_model,
                file=(filename or "speech.webm", io.BytesIO(audio_bytes), mime),
                timeout=settings.ai_audio_timeout_seconds,
            )
        except openai.APITimeoutError as exc:
            raise AssistantError("Transcription timed out. Please try again.") from exc
        except Exception as exc:
            logger.warning("Transcription failed: %s", exc)
            raise AssistantError(
                "Sorry, I could not hear that clearly. Please try again."
            ) from exc

        text = (result.text or "").strip()
        if not text:
            raise AssistantError(
                "No speech was detected in the recording. Please try again."
            )
        return text

    def speak(self, text: str, voice: str = "alloy") -> bytes:
        """
        Render *text* to speech (MP3) with ``gpt-4o-mini-tts``.

        The TTS layer is deliberately isolated here so a different
        provider can replace it without touching the chat pipeline.
        """
        if not self._openai:
            raise AssistantError("Voice replies are not configured.")

        text = (text or "").strip()
        if not text:
            raise AssistantError("There is nothing to read aloud yet.")
        text = text[:_MAX_TTS_CHARS]

        if voice not in _TTS_VOICES:
            voice = "alloy"

        try:
            try:
                speech = self._openai.audio.speech.create(
                    model=settings.ai_tts_model,
                    voice=voice,
                    input=text,
                    instructions=_TTS_INSTRUCTIONS,
                    timeout=settings.ai_audio_timeout_seconds,
                )
            except (openai.BadRequestError, TypeError):
                # Older TTS models don't accept instructions.
                speech = self._openai.audio.speech.create(
                    model=settings.ai_tts_model,
                    voice=voice,
                    input=text,
                    timeout=settings.ai_audio_timeout_seconds,
                )
            return speech.content
        except AssistantError:
            raise
        except Exception as exc:
            logger.warning("TTS failed: %s", exc)
            raise AssistantError(
                "I could not generate the audio, but the answer is on screen."
            ) from exc

    # ==================================================================
    # Greeting (GPT-4o Mini — cheap, localized, contextual)
    # ==================================================================

    def greeting(self, farmer_name: str, preferred_language: str) -> dict:
        """
        One short, localized, time-of-day greeting for the dashboard.

        Generated with the cheap utility model; falls back to hardcoded
        greetings so the dashboard never waits on an AI call.
        """
        hour = _now_karachi().hour
        part = "morning" if 5 <= hour < 12 else "afternoon" if 12 <= hour < 17 else "evening"
        lang = "ur" if preferred_language in {"ur", "pa", "sd"} else "en"

        first_name = (farmer_name or "").strip().split(" ")[0] or "farmer"
        cache_key = f"{lang}:{part}:{first_name.lower()}"

        cached = self._greeting_cache.get(cache_key)
        if cached and datetime.now().timestamp() - cached[0] < _GREETING_CACHE_TTL:
            return {
                "greeting": cached[1],
                "language": lang,
                "time_of_day": part,
            }

        greeting_text = _GREETING_FALLBACKS[(lang, part)]

        if self._openai:
            language_name = (
                "Urdu written in the Urdu script" if lang == "ur" else "simple English"
            )
            prompt = (
                f"Write ONE short greeting (maximum 12 words) for a Pakistani "
                f"farmer named {first_name} opening the Green Flora farming "
                f"app in the {part}. Language: {language_name}. It must feel "
                f"warm and welcoming, and mention that Green Flora is ready "
                f"to help with their farm today. Output ONLY the greeting "
                f"sentence — no quotes, no emojis, no explanation."
            )
            try:
                resp = self._openai.chat.completions.create(
                    model=settings.ai_utility_model,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.8,
                    timeout=settings.ai_audio_timeout_seconds,
                )
                generated = (resp.choices[0].message.content or "").strip().strip('"“”')
                if generated:
                    greeting_text = generated
            except Exception as exc:
                logger.warning("Greeting generation failed, using fallback: %s", exc)

        self._greeting_cache[cache_key] = (
            datetime.now().timestamp(), greeting_text
        )
        return {"greeting": greeting_text, "language": lang, "time_of_day": part}

    # ==================================================================
    # Entity extraction (GPT-4o Mini structured output)
    # ==================================================================

    _ENTITY_SCHEMA = {
        "name": "farming_entities",
        "schema": {
            "type": "object",
            "properties": {
                "crops": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Crop names mentioned, in English if possible",
                },
                "location": {
                    "type": "string",
                    "description": "Place/location mentioned, else empty string",
                },
                "market": {
                    "type": "string",
                    "description": "Mandi/market name mentioned, else empty string",
                },
                "date_time_reference": {
                    "type": "string",
                    "description": "Relative date/time mentioned (e.g. kal/today/next week), else empty string",
                },
                "farming_activity": {
                    "type": "string",
                    "description": "Farming activity mentioned (spray, irrigate, sow, harvest), else empty string",
                },
                "disease": {
                    "type": "string",
                    "description": "Disease/pest/symptom mentioned, else empty string",
                },
                "weather_intent": {"type": "boolean"},
                "price_intent": {"type": "boolean"},
                "irrigation_intent": {"type": "boolean"},
                "language": {
                    "type": "string",
                    "enum": ["en", "ur", "roman_ur", "mixed"],
                },
            },
            "required": [
                "crops", "location", "market", "date_time_reference",
                "farming_activity", "disease", "weather_intent",
                "price_intent", "irrigation_intent", "language",
            ],
        },
    }

    def _extract_entities_safe(self, text: str) -> Optional[dict]:
        """
        Extract farming entities from a (voice-transcribed) message using
        the cheap utility model. Failures are silent — the main model can
        work without this hint.
        """
        if not self._openai or not text.strip():
            return None
        try:
            resp = self._openai.chat.completions.create(
                model=settings.ai_utility_model,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "Extract farming entities from this message "
                            "from a Pakistani farmer (may be Urdu, Roman "
                            "Urdu, English or mixed)."
                        ),
                    },
                    {"role": "user", "content": text[:_MAX_MESSAGE_CHARS]},
                ],
                response_format={
                    "type": "json_schema",
                    "json_schema": self._ENTITY_SCHEMA,
                },
                timeout=settings.ai_audio_timeout_seconds,
            )
            return json.loads(resp.choices[0].message.content or "{}")
        except Exception as exc:
            logger.warning("Entity extraction failed: %s", exc)
            return None

    @staticmethod
    def _render_entity_notes(entities: dict) -> str:
        parts = []
        if entities.get("crops"):
            parts.append("crops: " + ", ".join(entities["crops"][:5]))
        for key, label in (
            ("location", "location"), ("market", "market"),
            ("date_time_reference", "time reference"),
            ("farming_activity", "activity"), ("disease", "disease/symptom"),
        ):
            if entities.get(key):
                parts.append(f"{label}: {entities[key]}")
        intents = [
            intent for intent in (
                "weather" if entities.get("weather_intent") else None,
                "price" if entities.get("price_intent") else None,
                "irrigation" if entities.get("irrigation_intent") else None,
            ) if intent
        ]
        if intents:
            parts.append("intents: " + ", ".join(intents))

        if not parts:
            return ""
        return (
            "\n\n## Voice input notes\n"
            "The farmer's latest message was spoken and transcribed "
            "(possible transcription noise). Detected entities — "
            + "; ".join(parts)
            + ".\n"
        )

    # ==================================================================
    # Prompt + input hygiene
    # ==================================================================

    def _build_system_prompt(self, snapshot: dict) -> str:
        now = _now_karachi()
        farmer_context = assistant_tools.render_farmer_context(snapshot)
        return f"""You are Green Flora AI — the intelligent farming assistant inside the Green Flora app, built for Pakistani farmers.

Today: {now.strftime('%A, %d %B %Y')} (Pakistan Standard Time).

## The farmer you are helping (their Green Flora profile)
{farmer_context}

## How to communicate
- Reply in the same language and script as the farmer's latest message.
- Be concise, direct, natural, friendly, and practical.
- Give the answer first. Do not explain your reasoning or retrieval process.
- Prefer 1–4 short sentences unless the farmer asks for detail.
- Do not unnecessarily repeat the question.
- Do not use phrases such as "according to", "based on the data", "I found",
  "I searched", "the source says", or similar source/retrieval language.
- Do not mention databases, APIs, models, tools, services, websites, articles,
  books, sources, citations, URLs, links, or search results in the answer.
- Never include a URL or hyperlink in the farmer-facing answer.
- Use confident wording when the available information is sufficient.
- If information is genuinely unavailable, say so simply and briefly.

## Information and tools
- Use Green Flora's internal data FIRST.
- For weather, use get_weather.
- For crop/mandi prices, use get_crop_market_data.
- For agricultural products, fertilizers, pesticides, weedicides and related
  recommendations, use search_agricultural_products.
- Use web search only when the required information is not available through
  Green Flora's internal data.
- Web search is a background research mechanism, not something to expose to
  the farmer.
- Never tell the farmer that web search was used.
- Never include web URLs, citations, source names, website names, article names,
  or links in the final answer.
- Use the useful information you find and answer the farmer naturally.

## Data integrity (critical — never break these rules)
- NEVER invent weather, prices, market data, product names, dosages, or dates. If a tool reports that data is unavailable, tell the farmer honestly and offer what you can instead.
- Weather drives field decisions: when the farmer asks about spraying, irrigation, sowing or harvesting, call get_weather first and use the real forecast in your answer.
- For any pesticide or fertilizer recommendation, prefer products from Green Flora's dataset, and always end with a one-line safety reminder (follow the label, wear protection, or consult the local agriculture officer if unsure).

## Personal context
- Use the farmer's profile above to personalize answers: their crops, location, soil, irrigation and budget.
- For vague questions like "should I spray today?", use their location's weather, their crops, and the season to give a specific, practical answer instead of a generic one.
- Keep the conversation natural — remember what was discussed earlier in this chat."""

    @staticmethod
    def _sanitize_messages(messages: list[dict]) -> list[dict]:
        """Keep only valid user/assistant turns, capped and trimmed."""
        cleaned: list[dict] = []
        for m in messages or []:
            if not isinstance(m, dict):
                continue
            role = m.get("role")
            content = m.get("content")
            if role not in ("user", "assistant"):
                continue
            if not isinstance(content, str) or not content.strip():
                continue
            cleaned.append({
                "role": role,
                "content": content.strip()[:_MAX_MESSAGE_CHARS],
            })
        return cleaned[-_MAX_HISTORY_MESSAGES:]


# Single shared instance.
assistant_service = AssistantService()