---
kind: external_dependency
name: OpenAI (GPT-5.6 Luna / gpt-4o-mini family)
slug: openai
category: external_dependency
category_hints:
    - vendor_identity
    - auth_protocol
scope:
    - '**'
---

Primary AI assistant provider via the OpenAI Responses API. The main reasoning model is configured as `gpt-5.6-luna` (`AI_MAIN_MODEL`), with utility tasks handled by `gpt-4o-mini`, transcription by `gpt-4o-mini-transcribe`, and TTS by `gpt-4o-mini-tts`. The key is injected through `OPENAI_API_KEY` in `Backend/.env`. Streaming responses use an adjustable timeout (`AI_STREAM_TIMEOUT_SECONDS`, default 180s; audio endpoints default 60s). When OpenAI experiences transient failures, Gemini Flash is used as a fallback. Model names are overridable via environment variables rather than hard-coded.