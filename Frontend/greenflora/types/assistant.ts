/**
 * types/assistant.ts
 *
 * TypeScript shapes for the Green Flora AI Assistant feature.
 * Mirrors the backend schemas in Backend/schemas/assistant.py and the
 * SSE event payloads produced by Backend/services/assistant_service.py.
 */

/** One turn of the conversation sent to POST /api/assistant/chat. */
export interface AssistantChatMessage {
  role: "user" | "assistant";
  content: string;
}

/** Body of POST /api/assistant/chat. */
export interface AssistantChatRequest {
  /** Conversation history (newest message last). */
  messages: AssistantChatMessage[];
  /** True when the newest message arrived via the microphone. */
  voice?: boolean;
}

/** Response of POST /api/assistant/transcribe. */
export interface TranscriptionResponse {
  text: string;
}

/** TTS voices supported by the backend (gpt-4o-mini-tts). */
export type AssistantVoice =
  | "alloy"
  | "echo"
  | "fable"
  | "onyx"
  | "nova"
  | "shimmer";

/** Body of POST /api/assistant/speak. */
export interface SpeakRequest {
  text: string;
  voice?: AssistantVoice;
}

/** Response of GET /api/assistant/greeting. */
export interface AssistantGreeting {
  greeting: string;
  language: "en" | "ur";
  time_of_day: "morning" | "afternoon" | "evening";
}

// ---------------------------------------------------------------------------
// SSE stream events (POST /api/assistant/chat)
//
// The backend streams frames shaped like:
//     event: status\ndata: {"type": "status", ...}\n\n
// and every JSON payload carries a discriminating "type" field.
// ---------------------------------------------------------------------------

/** Progress states emitted while the assistant is working. */
export type AssistantStatusState =
  | "thinking" // model is reasoning
  | "searching" // model is searching the web
  | "tool" // model is calling a Green Flora tool
  | "connecting_backup"; // OpenAI failed, Gemini taking over

/** {"type": "status"} — assistant progress update. */
export interface AssistantStatusEvent {
  type: "status";
  state: AssistantStatusState;
  /** Human-readable label safe to show the farmer. */
  label: string;
  /** Internal tool name (only present when state === "tool"). */
  tool?: string;
}

/** {"type": "delta"} — one chunk of the streamed answer. */
export interface AssistantDeltaEvent {
  type: "delta";
  text: string;
}

/** Which AI provider produced the final answer. */
export type AssistantProvider = "openai" | "gemini";

/** {"type": "done"} — final metadata for a completed answer. */
export interface AssistantDoneEvent {
  type: "done";
  provider: AssistantProvider;
  /** Internal Green Flora tools the model used (weather/market/products). */
  tools_used: string[];
  /** True when the model supplemented internal tools with web search. */
  web_search: boolean;
}

/** {"type": "error"} — friendly failure, possibly retryable. */
export interface AssistantErrorEvent {
  type: "error";
  message: string;
  retryable: boolean;
}

/** Union of every SSE event streamed by POST /api/assistant/chat. */
export type AssistantEvent =
  | AssistantStatusEvent
  | AssistantDeltaEvent
  | AssistantDoneEvent
  | AssistantErrorEvent;
