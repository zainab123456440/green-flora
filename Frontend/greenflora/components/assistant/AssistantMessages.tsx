/**
 * components/assistant/AssistantMessages.tsx
 *
 * The conversation view of the Green Flora AI assistant: RTL-aware
 * chat bubbles (Urdu text aligns itself via dir="auto"), streaming
 * and thinking states, per-message retry and listen controls, and the
 * welcome state with starter questions.
 */

import { useEffect, useRef } from "react";
import { Leaf, Loader2, RotateCcw, Sparkles, Volume2 } from "lucide-react";

import type { AssistantMessage } from "@/Hooks/useAssistant";

interface AssistantMessagesProps {
  messages: AssistantMessage[];
  /** Progress label for the in-flight reply ("Checking market prices"). */
  statusLabel: string | null;
  onRetry: () => void;
  onSpeakMessage: (text: string) => void;
  onSend: (text: string) => void;
}

/** Starter questions — mixed languages to show what the AI speaks. */
const STARTER_QUESTIONS = [
  "Aaj gehu ka rate kya hai?",
  "Should I spray my wheat field today?",
  "آج گندم کی قیمت کیا ہے؟",
  "Kisan Card ke fayde kya hain?",
];

/** Gentle three-dot indicator while waiting for the answer to start. */
function ThinkingDots() {
  return (
    <span className="inline-flex items-center gap-1" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-primary-400 animate-gf-pulse"
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </span>
  );
}

/** Welcome state shown before the first message. */
function WelcomeState({ onSend }: { onSend: (text: string) => void }) {
  return (
    <div className="relative flex h-full flex-col items-center justify-center overflow-hidden px-2 text-center">
      {/* Soft field glow behind the greeting — decorative only */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute h-40 w-40 rounded-full bg-primary-200/40 blur-3xl"
      />

      <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 via-primary-600 to-primary-800 text-primary-50 shadow-[0_8px_24px_-6px_rgba(22,101,52,0.5)]">
        <Sparkles className="h-6 w-6" />
        <span className="absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white text-primary-600 shadow-card ring-2 ring-white">
          <Leaf className="h-3.5 w-3.5" />
        </span>
      </div>

      <h3 className="relative mt-4 text-base font-semibold text-neutral-900">
        Assalam-o-Alaikum!
      </h3>
      <p className="relative mt-1 text-sm text-neutral-600">
        How can I help your farm today?
      </p>
      <p className="relative mt-1.5 max-w-sm text-xs leading-relaxed text-neutral-500">
        Ask about weather, crop prices, diseases or government schemes —
        type or speak in English, Urdu or Roman Urdu.
      </p>

      <div className="relative mt-5 flex max-w-md flex-wrap justify-center gap-2">
        {STARTER_QUESTIONS.map((question) => (
          <button
            key={question}
            type="button"
            dir="auto"
            onClick={() => onSend(question)}
            className="rounded-badge border border-primary-200/70 bg-primary-50/70 px-3 py-1.5 text-xs text-primary-800 transition-colors duration-150 hover:border-primary-400 hover:bg-primary-100 hover:text-primary-900"
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  );
}

interface MessageBubbleProps {
  message: AssistantMessage;
  statusLabel: string | null;
  onRetry: () => void;
  onSpeakMessage: (text: string) => void;
}

function MessageBubble({
  message,
  statusLabel,
  onRetry,
  onSpeakMessage,
}: MessageBubbleProps) {
  const isUser = message.role === "user";
  const isWaiting = message.isStreaming && !message.content;

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="mr-2.5 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-700">
          <Sparkles className="h-3.5 w-3.5" />
        </div>
      )}
      <div className="min-w-0 max-w-[88%] sm:max-w-[80%]">
        <div
          dir="auto"
          className={
            isUser
              ? "rounded-2xl rounded-br-md bg-primary-700 px-3.5 py-2.5 text-sm leading-relaxed text-primary-50"
              : "rounded-2xl rounded-bl-md border border-neutral-200 bg-surface-card px-3.5 py-2.5 text-sm leading-relaxed text-neutral-800"
          }
        >
          {isWaiting && statusLabel ? (
            <span className="inline-flex items-center gap-2 text-neutral-500">
              <Loader2
                className="h-3.5 w-3.5 shrink-0 animate-spin text-primary-600"
                aria-hidden="true"
              />
              {statusLabel}
            </span>
          ) : isWaiting ? (
            <ThinkingDots />
          ) : (
            <>
              <span className="whitespace-pre-wrap break-words">
                {message.content}
              </span>
              {message.isStreaming && (
                <span
                  className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 rounded-full bg-primary-600 animate-gf-pulse"
                  aria-hidden="true"
                />
              )}
            </>
          )}
        </div>

        {/* Failure notice + retry */}
        {message.error && (
          <div className="mt-1.5 flex items-start gap-2 rounded-lg border border-danger-100 bg-danger-50 px-3 py-2">
            <p className="min-w-0 flex-1 text-xs leading-relaxed text-danger-600">
              {message.error}
            </p>
            {message.retryable !== false && (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex shrink-0 items-center gap-1 rounded-md bg-danger-600 px-2 py-1 text-xs font-medium text-white transition-colors duration-150 hover:bg-danger-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger-500 focus-visible:ring-offset-1"
              >
                <RotateCcw className="h-3 w-3" />
                Try again
              </button>
            )}
          </div>
        )}

        {/* Read this reply aloud */}
        {!isUser && !message.isStreaming && !message.error && message.content && (
          <button
            type="button"
            onClick={() => onSpeakMessage(message.content)}
            className="mt-1.5 inline-flex items-center gap-1.5 rounded-full border border-primary-200 bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700 shadow-sm transition-colors duration-150 hover:border-primary-400 hover:bg-primary-100 hover:text-primary-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
          >
            <Volume2 className="h-4 w-4" />
            Listen
          </button>
        )}
      </div>
    </div>
  );
}

export default function AssistantMessages({
  messages,
  statusLabel,
  onRetry,
  onSpeakMessage,
  onSend,
}: AssistantMessagesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);

  // Follow the newest content only while the farmer is already at the
  // bottom, so scrolling up to reread is never fought.
  useEffect(() => {
    const el = containerRef.current;
    if (el && stickToBottomRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  });

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    stickToBottomRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="h-[340px] overflow-y-auto px-4 py-4 sm:h-[400px] sm:px-5"
    >
      {messages.length === 0 ? (
        <WelcomeState onSend={onSend} />
      ) : (
        <div className="space-y-3">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              statusLabel={statusLabel}
              onRetry={onRetry}
              onSpeakMessage={onSpeakMessage}
            />
          ))}
        </div>
      )}
    </div>
  );
}