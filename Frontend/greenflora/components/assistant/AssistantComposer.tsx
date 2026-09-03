/**
 * components/assistant/AssistantComposer.tsx
 *
 * Input bar of the assistant: a text field, a microphone control, and
 * a send/stop button that adapts to the current phase.
 *
 *   ready        -> type + Send, mic ready
 *   listening    -> mic turns into a red stop-and-send button
 *   transcribing -> mic shows a spinner, input disabled
 *   thinking/    -> Send becomes Stop (cancels the stream)
 *   generating
 *   speaking     -> Send becomes Stop (silences the reply)
 */

import { useState, type FormEvent, type KeyboardEvent } from "react";
import { Loader2, Mic, Send, Square } from "lucide-react";

import type { AssistantPhase } from "@/Hooks/useAssistant";

interface AssistantComposerProps {
  phase: AssistantPhase;
  isBusy: boolean;
  micSupported: boolean;
  onSend: (text: string) => void;
  onStartListening: () => void;
  onStopListening: () => void;
  onStop: () => void;
}

const sendButtonBase =
  "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-input transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50";

export default function AssistantComposer({
  phase,
  isBusy,
  micSupported,
  onSend,
  onStartListening,
  onStopListening,
  onStop,
}: AssistantComposerProps) {
  const [value, setValue] = useState("");

  const isListening = phase === "listening";
  const isTranscribing = phase === "transcribing";
  const isSpeaking = phase === "speaking";
  const showStop = isBusy || isSpeaking;

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    const text = value.trim();
    if (!text || isBusy) return;
    onSend(text);
    setValue("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <form
      onSubmit={submit}
      className="flex items-center gap-2.5 border-t border-primary-900/[0.06] bg-primary-50/40 px-4 py-3 sm:px-5"
    >
      {/* Microphone: the panel's primary action. Record -> stop-and-send.
          Hidden when unsupported. */}
      {micSupported && (
        <div className="relative shrink-0">
          {/* Soft resting glow, so the mic reads as the main call-to-action
              even before it's tapped. */}
          {!isListening && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-primary-500/30 blur-md"
            />
          )}
          {/* Pulsing rings while actively recording. */}
          {isListening && (
            <>
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -z-10 animate-ping rounded-full bg-danger-500/40 motion-reduce:animate-none"
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -inset-2 -z-10 rounded-full bg-danger-500/15 blur-sm"
              />
            </>
          )}
          <button
            type="button"
            onClick={isListening ? onStopListening : onStartListening}
            disabled={isTranscribing || (!isListening && isBusy)}
            aria-label={
              isListening ? "Stop recording and send" : "Speak your question"
            }
            title={
              isListening ? "Stop recording and send" : "Speak your question"
            }
            className={
              isListening
                ? "relative inline-flex h-14 w-14 items-center justify-center rounded-full bg-danger-600 text-white shadow-[0_6px_20px_-4px_rgba(220,38,38,0.55)] transition-transform duration-150 hover:bg-danger-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                : "relative inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 via-primary-600 to-primary-800 text-primary-50 shadow-[0_6px_20px_-4px_rgba(22,101,52,0.55)] transition-transform duration-150 hover:scale-105 hover:shadow-[0_8px_24px_-4px_rgba(22,101,52,0.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
            }
          >
            {isListening ? (
              <Square className="h-5 w-5" />
            ) : isTranscribing ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Mic className="h-6 w-6" />
            )}
          </button>
        </div>
      )}

      <input
        dir="auto"
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={
          isListening
            ? "Listening… tap the mic to send"
            : isTranscribing
              ? "Transcribing your voice…"
              : "Ask about weather, prices, crops…"
        }
        aria-label="Ask Green Flora AI"
        autoComplete="off"
        maxLength={4000}
        className="min-w-0 flex-1 rounded-full border border-primary-900/10 bg-white/80 px-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 shadow-inner transition-colors duration-150 focus:border-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-600"
      />

      {/* Send / Stop — secondary to the mic */}
      {showStop ? (
        <button
          type="button"
          onClick={onStop}
          aria-label="Stop"
          title="Stop"
          className={`${sendButtonBase} bg-danger-600 text-white hover:bg-danger-500`}
        >
          <Square className="h-4 w-4" />
        </button>
      ) : (
        <button
          type="submit"
          disabled={!value.trim()}
          aria-label="Send message"
          title="Send message"
          className={`${sendButtonBase} bg-primary-700 text-primary-50 hover:bg-primary-800`}
        >
          <Send className="h-4.5 w-4.5" />
        </button>
      )}
    </form>
  );
}