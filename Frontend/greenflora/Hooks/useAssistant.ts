/**
 * Hooks/useAssistant.ts
 *
 * State machine + data plumbing for the Green Flora AI assistant:
 * streaming chat (SSE), microphone capture, transcription, and
 * text-to-speech playback.
 *
 * Phases flow like this:
 *   ready → listening → transcribing → thinking → generating → speaking → ready
 *
 * Failure rules (per product spec):
 *   - Transcription failure never blocks typing — it surfaces a notice.
 *   - TTS failure never breaks the text reply — it fails quietly.
 *   - Chat errors attach to the message with a retry action.
 */

"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  AssistantApiError,
  getGreeting,
  speak as speakApi,
  streamChat,
  transcribeAudio,
} from "@/services/AssistantAPI";
import type {
  AssistantChatMessage,
  AssistantGreeting,
} from "@/types/assistant";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** High-level assistant state used by the UI. */
export type AssistantPhase =
  | "ready" // idle, waiting for input
  | "listening" // microphone is recording
  | "transcribing" // recorded audio → text
  | "thinking" // sent, waiting for the answer to start
  | "generating" // answer is streaming in
  | "speaking"; // reply is being read aloud

/** One rendered conversation turn. */
export interface AssistantMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  /** True while the assistant reply is still streaming in. */
  isStreaming: boolean;
  /** Friendly error attached to an assistant reply (retryable). */
  error: string | null;
  retryable: boolean;
}

// ---------------------------------------------------------------------------
// Constants / helpers
// ---------------------------------------------------------------------------

/** Conversation window sent to the backend (mirrors its sanitizer). */
const HISTORY_LIMIT = 16;
/** Max characters per message (mirrors backend validation). */
const MAX_CONTENT = 4000;

const FALLBACK_GREETING: AssistantGreeting = {
  greeting: "Assalam-o-Alaikum! How can Green Flora help your farm today?",
  language: "en",
  time_of_day: "morning",
};

let messageCounter = 0;
function nextMessageId(): string {
  messageCounter += 1;
  return `msg-${Date.now().toString(36)}-${messageCounter}`;
}

/** Prefer compact browser-native recording formats. */
function pickRecorderMimeType(): string | undefined {
  if (typeof window === "undefined" || typeof MediaRecorder === "undefined") {
    return undefined;
  }
  const candidates = ["audio/webm", "audio/mp4"];
  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return undefined;
}

function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === "AbortError";
}

// --- Microphone support (client-only value) --------------------------------
//
// Whether the browser can record audio never changes during a session,
// so it is read as a cached external snapshot. useSyncExternalStore's
// server snapshot (false) keeps hydration mismatch-free.

let micSupportCache: boolean | null = null;

function getMicSnapshot(): boolean {
  if (micSupportCache === null) {
    micSupportCache =
      typeof window !== "undefined" &&
      !!navigator.mediaDevices?.getUserMedia &&
      typeof window.MediaRecorder !== "undefined";
  }
  return micSupportCache;
}

function getServerMicSnapshot(): boolean {
  return false;
}

function subscribeToNothing(): () => void {
  return () => {};
}

// ---------------------------------------------------------------------------
// useAssistant — chat + voice state machine
// ---------------------------------------------------------------------------

export interface UseAssistantResult {
  messages: AssistantMessage[];
  phase: AssistantPhase;
  /** Progress label while thinking/generating ("Checking market prices"). */
  statusLabel: string | null;
  /** Transient voice-related notice (mic blocked, transcription failed). */
  voiceNotice: string | null;
  /** Whether this browser supports microphone recording. */
  micSupported: boolean;
  /** Voice conversation mode: replies are read aloud automatically. */
  autoSpeak: boolean;
  /** True while a request is in flight (thinking/generating/transcribing). */
  isBusy: boolean;

  sendMessage: (text: string, options?: { voice?: boolean }) => Promise<void>;
  startListening: () => Promise<void>;
  /** Stop recording and send the captured speech. */
  stopListening: () => void;
  /** Stop recording and discard the captured speech. */
  cancelListening: () => void;
  /** Read one message aloud on demand. */
  speakMessage: (text: string) => void;
  /** Universal stop: cancels recording, playback, or generation. */
  stop: () => void;
  /** Re-ask the last question after a failure. */
  retry: () => void;
  toggleAutoSpeak: () => void;
  clearConversation: () => void;
}

export function useAssistant(): UseAssistantResult {
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [phase, setPhase] = useState<AssistantPhase>("ready");
  const [statusLabel, setStatusLabel] = useState<string | null>(null);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);
  const [autoSpeak, setAutoSpeak] = useState(false);

  // --- refs (latest values for async flows) --------------------------------
  const mountedRef = useRef(true);
  const messagesRef = useRef<AssistantMessage[]>([]);
  const busyRef = useRef(false); // a chat stream is active
  const autoSpeakRef = useRef(false);
  const ttsFailedRef = useRef(false); // show the TTS notice only once
  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  // Microphone
  const recorderRef = useRef<MediaRecorder | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const discardRecordingRef = useRef(false);

  // Text-to-speech playback
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  // Browser capability — a client-only value read via external snapshot.
  const micSupported = useSyncExternalStore(
    subscribeToNothing,
    getMicSnapshot,
    getServerMicSnapshot
  );

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // --- TTS playback ---------------------------------------------------------

  const cleanupAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    const wasPlaying = audioRef.current !== null;
    cleanupAudio();
    if (wasPlaying) {
      setPhase((prev) => (prev === "speaking" ? "ready" : prev));
    }
    return wasPlaying;
  }, [cleanupAudio]);

  /** Fetch MP3 and play it. TTS failures never break the text reply. */
  const speakReply = useCallback(
    async (text: string) => {
      const clean = text.trim();
      if (!clean) return;
      try {
        const blob = await speakApi(clean);
        if (!mountedRef.current) return;
        cleanupAudio();
        const url = URL.createObjectURL(blob);
        audioUrlRef.current = url;
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => {
          cleanupAudio();
          setPhase((prev) => (prev === "speaking" ? "ready" : prev));
        };
        audio.onerror = () => {
          cleanupAudio();
          setPhase((prev) => (prev === "speaking" ? "ready" : prev));
        };
        setPhase("speaking");
        await audio.play();
      } catch {
        // Voice must never break the text experience.
        cleanupAudio();
        setPhase((prev) => (prev === "speaking" ? "ready" : prev));
        if (!ttsFailedRef.current) {
          ttsFailedRef.current = true;
          setVoiceNotice("Voice reply is unavailable right now.");
        }
      }
    },
    [cleanupAudio]
  );

  // --- Microphone -----------------------------------------------------------

  const releaseMic = useCallback(() => {
    if (recorderRef.current) {
      const recorder = recorderRef.current;
      recorder.ondataavailable = null;
      recorder.onstop = null;
      if (recorder.state !== "inactive") {
        recorder.stop();
      }
      recorderRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }
  }, []);

  const cancelListening = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    discardRecordingRef.current = true;
    recorder.stop(); // onstop sees the discard flag
    setPhase((prev) =>
      prev === "listening" || prev === "transcribing" ? "ready" : prev
    );
  }, []);

  const sendMessage = useCallback(
    async (text: string, options?: { voice?: boolean }) => {
      const trimmed = text.trim();
      if (!trimmed || busyRef.current) return;

      // Typing while recording: discard the recording and send the text.
      if (recorderRef.current?.state === "recording") {
        cancelListening();
      }
      stopSpeaking();

      // Conversation history: everything durable so far + this question.
      const history: AssistantChatMessage[] = messagesRef.current
        .filter((m) => m.role === "user" || (m.content.trim() && !m.error))
        .map((m) => ({
          role: m.role,
          content: m.content.slice(0, MAX_CONTENT),
        }));
      history.push({ role: "user", content: trimmed.slice(0, MAX_CONTENT) });
      const windowed = history.slice(-HISTORY_LIMIT);

      const assistantId = nextMessageId();
      setMessages((prev) => [
        ...prev,
        {
          id: nextMessageId(),
          role: "user",
          content: trimmed,
          isStreaming: false,
          error: null,
          retryable: false,
        },
        {
          id: assistantId,
          role: "assistant",
          content: "",
          isStreaming: true,
          error: null,
          retryable: false,
        },
      ]);
      setPhase("thinking");
      setStatusLabel(null);
      setVoiceNotice(null);

      busyRef.current = true;
      const requestId = ++requestIdRef.current;
      const controller = new AbortController();
      abortRef.current?.abort();
      abortRef.current = controller;

      const finalize = () => {
        // Streams can end without a done/error event (connection drop):
        // keep partial text, or surface a retryable error when empty.
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id !== assistantId || !m.isStreaming) return m;
            return m.content
              ? { ...m, isStreaming: false }
              : {
                  ...m,
                  isStreaming: false,
                  error: "The answer was interrupted. Please try again.",
                  retryable: true,
                };
          })
        );
        setPhase((prev) =>
          prev === "thinking" || prev === "generating" ? "ready" : prev
        );
        setStatusLabel(null);
      };

      let fullText = "";

      try {
        await streamChat({
          messages: windowed,
          voice: options?.voice ?? false,
          signal: controller.signal,
          onEvent: (event) => {
            if (requestId !== requestIdRef.current) return; // superseded
            if (event.type === "status") {
              setStatusLabel(event.label || null);
              setPhase((prev) => (prev === "generating" ? prev : "thinking"));
            } else if (event.type === "delta") {
              fullText += event.text;
              setStatusLabel(null);
              setPhase("generating");
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: m.content + event.text }
                    : m
                )
              );
            } else if (event.type === "done") {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, isStreaming: false } : m
                )
              );
              setStatusLabel(null);
              if (autoSpeakRef.current && fullText.trim()) {
                setPhase("speaking");
                void speakReply(fullText);
              } else {
                setPhase("ready");
              }
            } else if (event.type === "error") {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? {
                        ...m,
                        isStreaming: false,
                        error: event.message,
                        retryable: event.retryable,
                      }
                    : m
                )
              );
              setPhase("ready");
              setStatusLabel(null);
            }
          },
        });

        if (requestId === requestIdRef.current) {
          finalize();
        }
      } catch (err) {
        if (requestId !== requestIdRef.current) return; // superseded
        if (isAbortError(err)) {
          // The farmer pressed stop — keep whatever already streamed.
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, isStreaming: false } : m
            )
          );
          setPhase("ready");
          setStatusLabel(null);
        } else {
          const message =
            err instanceof AssistantApiError
              ? err.message
              : "Green Flora AI could not answer right now. Please try again.";
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    isStreaming: false,
                    error: message,
                    retryable: true,
                  }
                : m
            )
          );
          setPhase("ready");
          setStatusLabel(null);
        }
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null;
        }
        busyRef.current = false;
      }
    },
    [cancelListening, speakReply, stopSpeaking]
  );

  /** Transcribe the recording, then send it as a voice message. */
  const transcribeAndSend = useCallback(
    async (blob: Blob, ext: string) => {
      setPhase("transcribing");
      setStatusLabel("Transcribing your voice");
      try {
        const text = await transcribeAudio(blob, `speech.${ext}`);
        if (!mountedRef.current) return;
        setStatusLabel(null);
        if (!text.trim()) {
          setPhase("ready");
          setVoiceNotice(
            "We couldn't hear any words. Please try again or type your question."
          );
          return;
        }
        // Voice conversation mode: replies will be read aloud.
        autoSpeakRef.current = true;
        setAutoSpeak(true);
        await sendMessage(text, { voice: true });
      } catch (err) {
        if (!mountedRef.current) return;
        setStatusLabel(null);
        setPhase("ready");
        setVoiceNotice(
          err instanceof AssistantApiError
            ? err.message
            : "Voice message could not be transcribed. Please try again or type your question."
        );
      }
    },
    [sendMessage]
  );

  const startListening = useCallback(async () => {
    if (!micSupported || busyRef.current) return;
    if (recorderRef.current) return; // already recording
    stopSpeaking();
    setVoiceNotice(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      if (!mountedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      const mimeType = pickRecorderMimeType();
      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined
      );
      chunksRef.current = [];
      discardRecordingRef.current = false;
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        // Detach handlers before reading the collected chunks.
        releaseMic();
        const discard = discardRecordingRef.current;
        discardRecordingRef.current = false;
        const chunks = chunksRef.current;
        chunksRef.current = [];

        if (discard) {
          setPhase((prev) =>
            prev === "listening" || prev === "transcribing" ? "ready" : prev
          );
          return;
        }
        if (chunks.length === 0) {
          setPhase("ready");
          setVoiceNotice(
            "No speech was captured. Please try again or type your question."
          );
          return;
        }
        const blob = new Blob(chunks, {
          type: recorder.mimeType || chunks[0].type || "audio/webm",
        });
        const ext = blob.type.includes("mp4") ? "mp4" : "webm";
        void transcribeAndSend(blob, ext);
      };

      micStreamRef.current = stream;
      recorderRef.current = recorder;
      recorder.start();
      setPhase("listening");
    } catch (err) {
      releaseMic();
      setPhase((prev) => (prev === "listening" ? "ready" : prev));
      setVoiceNotice(
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "Microphone access was blocked. Allow the microphone and try again, or type your question."
          : "The microphone is not available. You can still type your question."
      );
    }
  }, [micSupported, releaseMic, stopSpeaking, transcribeAndSend]);

  const stopListening = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    discardRecordingRef.current = false;
    setPhase("transcribing"); // instant feedback; onstop sends the audio
    recorder.stop();
  }, []);

  const speakMessage = useCallback(
    (text: string) => {
      if (busyRef.current || recorderRef.current) return;
      if (!text.trim()) return;
      void speakReply(text);
    },
    [speakReply]
  );

  const stop = useCallback(() => {
    if (recorderRef.current) {
      cancelListening();
      return;
    }
    if (audioRef.current) {
      stopSpeaking();
      return;
    }
    abortRef.current?.abort();
  }, [cancelListening, stopSpeaking]);

  const retry = useCallback(() => {
    if (busyRef.current) return;
    const msgs = messagesRef.current;
    let lastUserIndex = -1;
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === "user") {
        lastUserIndex = i;
        break;
      }
    }
    if (lastUserIndex === -1) return;
    const question = msgs[lastUserIndex].content;
    const trimmed = msgs.slice(0, lastUserIndex);
    messagesRef.current = trimmed;
    setMessages(trimmed);
    void sendMessage(question);
  }, [sendMessage]);

  const toggleAutoSpeak = useCallback(() => {
    const next = !autoSpeakRef.current;
    autoSpeakRef.current = next;
    setAutoSpeak(next);
    if (!next) stopSpeaking();
  }, [stopSpeaking]);

  const clearConversation = useCallback(() => {
    abortRef.current?.abort();
    discardRecordingRef.current = true;
    releaseMic();
    stopSpeaking();
    messagesRef.current = [];
    setMessages([]);
    setPhase("ready");
    setStatusLabel(null);
    setVoiceNotice(null);
  }, [releaseMic, stopSpeaking]);

  // Unmount safety: cancel any in-flight request, recording, and playback.
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
      discardRecordingRef.current = true;
      releaseMic();
      cleanupAudio();
    };
  }, [releaseMic, cleanupAudio]);

  const isBusy =
    phase === "thinking" || phase === "generating" || phase === "transcribing";

  return {
    messages,
    phase,
    statusLabel,
    voiceNotice,
    micSupported,
    autoSpeak,
    isBusy,
    sendMessage,
    startListening,
    stopListening,
    cancelListening,
    speakMessage,
    stop,
    retry,
    toggleAutoSpeak,
    clearConversation,
  };
}

// ---------------------------------------------------------------------------
// useGreeting — dashboard hero greeting
// ---------------------------------------------------------------------------

export interface UseGreetingResult {
  greeting: AssistantGreeting;
  isLoading: boolean;
}

/**
 * Loads the localized, time-of-day greeting for the dashboard hero.
 * Never fails — falls back to a static greeting so the dashboard
 * always renders.
 */
export function useGreeting(): UseGreetingResult {
  const [greeting, setGreeting] = useState<AssistantGreeting | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await getGreeting();
        if (!cancelled) setGreeting(result);
      } catch {
        if (!cancelled) setGreeting(FALLBACK_GREETING);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    greeting: greeting ?? FALLBACK_GREETING,
    isLoading,
  };
}
