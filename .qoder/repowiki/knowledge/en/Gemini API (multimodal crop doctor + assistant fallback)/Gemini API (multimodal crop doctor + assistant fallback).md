---
kind: external_dependency
name: Gemini API (multimodal crop doctor + assistant fallback)
slug: gemini-api
category: external_dependency
category_hints:
    - vendor_identity
    - auth_protocol
scope:
    - '**'
---

Used for two purposes: multimodal image analysis in the Crop Doctor feature and as a transient-failure fallback for the AI Assistant when OpenAI is unavailable. The fallback model is configured via `AI_FALLBACK_MODEL` (default `gemini-3.6-flash`) and the key via `GEMINI_API_KEY` in `Backend/.env`. Because it serves as a failover path, integration code must treat Gemini responses as equivalent in shape to OpenAI responses so the assistant layer can switch providers transparently.