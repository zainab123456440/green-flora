/**
 * services/AssistantAPI.ts
 *
 * The single place the frontend talks to the backend's AI assistant
 * endpoints: the streaming chat (SSE), speech-to-text, text-to-speech,
 * and the dashboard greeting.
 *
 * Follows the same conventions as MarketAPI.ts — one error class with
 * a friendly type, Bearer auth when a token is stored, and human-readable
 * error messages (never raw API errors).
 */

import type {
  AssistantChatMessage,
  AssistantEvent,
  AssistantGreeting,
  AssistantStatusState,
  AssistantVoice,
  TranscriptionResponse,
} from "@/types/assistant";
import { getStoredAccessToken } from "@/services/AuthAPI";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

const REQUEST_TIMEOUT_MS = 20000;
const TRANSCRIBE_TIMEOUT_MS = 60000;
const SPEAK_TIMEOUT_MS = 90000;

export class AssistantApiError extends Error {
  status: number;
  type: "network" | "timeout" | "validation" | "server" | "auth" | "unknown";

  constructor(
    message: string,
    status: number,
    type: AssistantApiError["type"] = "unknown"
  ) {
    super(message);
    this.name = "AssistantApiError";
    this.status = status;
    this.type = type;
  }
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function classifyStatus(status: number): AssistantApiError["type"] {
  if (status === 401 || status === 403) return "auth";
  if (status >= 400 && status < 500) return "validation";
  if (status >= 500) return "server";
  return "unknown";
}

/** Extract FastAPI's {"detail": "..."} message, falling back to statusText. */
async function extractDetail(response: Response): Promise<string> {
  try {
    const body = await response.json();
    if (body && typeof body.detail === "string" && body.detail) {
      return body.detail;
    }
  } catch {
    // not JSON — ignore
  }
  return response.statusText;
}

async function toApiError(
  response: Response,
  fallbackMessage: string
): Promise<AssistantApiError> {
  const detail = await extractDetail(response);
  return new AssistantApiError(
    detail && detail !== response.statusText ? detail : fallbackMessage,
    response.status,
    classifyStatus(response.status)
  );
}

/** Map transport-level failures to a single friendly error. */
function toFriendlyError(err: unknown, fallbackMessage: string): AssistantApiError {
  if (err instanceof AssistantApiError) return err;
  if (err instanceof DOMException && err.name === "AbortError") {
    return new AssistantApiError(
      "This took too long. Please try again.",
      408,
      "timeout"
    );
  }
  return new AssistantApiError(fallbackMessage, 0, "network");
}

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  const token = getStoredAccessToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

// ---------------------------------------------------------------------------
// Dashboard greeting
// ---------------------------------------------------------------------------

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: { "Content-Type": "application/json", ...authHeaders() },
      signal: controller.signal,
      ...init,
    });

    if (!response.ok) {
      throw await toApiError(
        response,
        "Green Flora AI is not available right now."
      );
    }

    return response.json() as Promise<T>;
  } catch (err) {
    throw toFriendlyError(
      err,
      "Green Flora AI is not available right now. Please check your connection."
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

/** Short, localized, time-of-day greeting for the dashboard hero. */
export function getGreeting(): Promise<AssistantGreeting> {
  return request<AssistantGreeting>("/api/assistant/greeting");
}

// ---------------------------------------------------------------------------
// Chat (streaming over Server-Sent Events)
// ---------------------------------------------------------------------------

export interface StreamChatOptions {
  /** Conversation history (newest message last). */
  messages: AssistantChatMessage[];
  /** True when the newest message arrived via the microphone. */
  voice?: boolean;
  /** Called once for every SSE event the backend streams. */
  onEvent: (event: AssistantEvent) => void;
  /** Aborts the stream (e.g. the farmer pressed stop). */
  signal?: AbortSignal;
}

/**
 * Parse one SSE frame ("event: ...\\ndata: {...}") into a typed event.
 * Returns null for malformed or unknown frames so the stream never crashes.
 */
function parseSseFrame(frame: string): AssistantEvent | null {
  let eventName = "";
  const dataLines: string[] = [];

  for (const rawLine of frame.split("\n")) {
    const line = rawLine.endsWith("\r") ? rawLine.slice(0, -1) : rawLine;
    if (!line || line.startsWith(":")) continue;
    if (line.startsWith("event:")) {
      eventName = line.slice("event:".length).trim();
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice("data:".length).trimStart());
    }
  }

  if (dataLines.length === 0) return null;

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(dataLines.join("\n")) as Record<string, unknown>;
  } catch {
    return null;
  }

  const type = typeof payload.type === "string" ? payload.type : eventName;

  switch (type) {
    case "status":
      return {
        type: "status",
        state: (payload.state as AssistantStatusState) || "thinking",
        label: typeof payload.label === "string" ? payload.label : "",
        tool: typeof payload.tool === "string" ? payload.tool : undefined,
      };
    case "delta":
      return {
        type: "delta",
        text: typeof payload.text === "string" ? payload.text : "",
      };
    case "done":
      return {
        type: "done",
        provider: payload.provider === "gemini" ? "gemini" : "openai",
        tools_used: Array.isArray(payload.tools_used)
          ? (payload.tools_used as string[])
          : [],
        web_search: Boolean(payload.web_search),
      };
    case "error":
      return {
        type: "error",
        message:
          typeof payload.message === "string"
            ? payload.message
            : "Green Flora AI could not answer. Please try again.",
        retryable: payload.retryable !== false,
      };
    default:
      return null;
  }
}

/**
 * Stream an assistant reply from POST /api/assistant/chat.
 *
 * Resolves when the stream ends (a "done" or "error" event has been
 * delivered through onEvent). Throws AssistantApiError for connection
 * failures and rethrows the original AbortError when cancelled via
 * `signal`. No overall timeout — tool calls and web search can
 * legitimately take a while; cancellation is the caller's job.
 */
export async function streamChat(options: StreamChatOptions): Promise<void> {
  const { messages, voice = false, onEvent, signal } = options;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/assistant/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
        ...authHeaders(),
      },
      body: JSON.stringify({ messages, voice }),
      signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw new AssistantApiError(
      "Green Flora AI could not be reached. Please check your connection.",
      0,
      "network"
    );
  }

  if (!response.ok) {
    throw await toApiError(
      response,
      "Green Flora AI could not answer right now. Please try again."
    );
  }

  if (!response.body) {
    throw new AssistantApiError(
      "Green Flora AI is not available right now. Please try again.",
      0,
      "network"
    );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  // Deliver every complete frame currently sitting in the buffer.
  const flushFrames = () => {
    for (;;) {
      const separator = buffer.indexOf("\n\n");
      if (separator === -1) break;
      const frame = buffer.slice(0, separator);
      buffer = buffer.slice(separator + 2);
      const event = parseSseFrame(frame);
      if (event) onEvent(event);
    }
  };

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      // Normalise CRLF (some proxies rewrite line endings) so frame
      // splitting stays reliable.
      buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");
      flushFrames();
    }
    buffer += decoder.decode().replace(/\r\n/g, "\n");
    flushFrames();
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw new AssistantApiError(
      "The connection to Green Flora AI was interrupted. Please try again.",
      0,
      "network"
    );
  }
}

// ---------------------------------------------------------------------------
// Speech-to-text
// ---------------------------------------------------------------------------

/**
 * Transcribe recorded speech (Urdu / English / mixed) to text via
 * POST /api/assistant/transcribe. Returns the transcribed text.
 */
export async function transcribeAudio(
  audio: Blob,
  filename = "speech.webm"
): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TRANSCRIBE_TIMEOUT_MS);

  const fallback =
    "Voice message could not be transcribed. Please try again or type your question.";

  try {
    const form = new FormData();
    form.append("file", audio, filename);

    // No Content-Type header — the browser sets the multipart boundary.
    const response = await fetch(`${API_BASE_URL}/api/assistant/transcribe`, {
      method: "POST",
      headers: authHeaders(),
      body: form,
      signal: controller.signal,
    });

    if (!response.ok) throw await toApiError(response, fallback);

    const data = (await response.json()) as TranscriptionResponse;
    return data.text ?? "";
  } catch (err) {
    throw toFriendlyError(err, fallback);
  } finally {
    clearTimeout(timeoutId);
  }
}

// ---------------------------------------------------------------------------
// Text-to-speech
// ---------------------------------------------------------------------------

/**
 * Read *text* aloud: POST /api/assistant/speak returns an MP3 Blob.
 * Failures throw AssistantApiError — callers decide how loudly to
 * surface them (voice must never break the text experience).
 */
export async function speak(
  text: string,
  voice: AssistantVoice = "alloy"
): Promise<Blob> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SPEAK_TIMEOUT_MS);

  const fallback = "Voice reply is unavailable right now.";

  try {
    const response = await fetch(`${API_BASE_URL}/api/assistant/speak`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
      },
      body: JSON.stringify({ text, voice }),
      signal: controller.signal,
    });

    if (!response.ok) throw await toApiError(response, fallback);

    return await response.blob();
  } catch (err) {
    throw toFriendlyError(err, fallback);
  } finally {
    clearTimeout(timeoutId);
  }
}
