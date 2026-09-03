/**
 * components/assistant/AssistantPanel.tsx
 *
 * The Green Flora AI assistant — the dashboard's central experience.
 * Streams answers over SSE, captures voice questions, and reads
 * replies aloud. All chat/voice state lives in the useAssistant hook;
 * this component is purely presentation.
 */

import { Info, Leaf, Sparkles, Trash2, Volume2, VolumeX } from "lucide-react";

import Card from "@/components/ui/Card";
import AssistantMessages from "@/components/assistant/AssistantMessages";
import AssistantComposer from "@/components/assistant/AssistantComposer";
import { useAssistant, type AssistantPhase } from "@/Hooks/useAssistant";

/** Header pill labels for the active phase. */
const PHASE_LABELS: Partial<Record<AssistantPhase, string>> = {
  listening: "Listening",
  transcribing: "Transcribing",
  thinking: "Thinking",
  generating: "Typing",
  speaking: "Speaking",
};

const headerIconButton =
  "inline-flex h-8 w-8 items-center justify-center rounded-lg text-primary-900/40 transition-colors duration-150 hover:bg-primary-900/5 hover:text-primary-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-1";

export default function AssistantPanel() {
  const {
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
    speakMessage,
    stop,
    retry,
    toggleAutoSpeak,
    clearConversation,
  } = useAssistant();

  const phaseLabel = PHASE_LABELS[phase];
  const isListening = phase === "listening";

  return (
    <Card variant="elevated" padding="none" className="overflow-hidden">
      {/* Nature-inspired wrapper: soft field gradient + a faint leaf-vein
          watermark. Decorative only — never intercepts clicks. */}
      <div className="relative bg-gradient-to-b from-primary-50/80 via-white to-white">
        <svg
          aria-hidden="true"
          viewBox="0 0 200 200"
          className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 text-primary-700/[0.06] sm:h-56 sm:w-56"
        >
          <path
            fill="currentColor"
            d="M100 10c50 20 80 60 80 100s-40 70-80 80c-8-45-8-90 0-135-30 35-45 70-45 100 0-50 15-105 45-145z"
          />
        </svg>

        {/* Header */}
        <div className="relative flex items-center justify-between gap-3 border-b border-primary-900/[0.06] px-4 py-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 via-primary-600 to-primary-800 text-primary-50 shadow-[0_4px_14px_-2px_rgba(22,101,52,0.45)]">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <h2 className="text-sm font-semibold text-neutral-900">
                  Green Flora AI
                </h2>
                {phaseLabel && (
                  <span className="inline-flex items-center gap-1.5 rounded-badge bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-800">
                    {isListening ? (
                      <Leaf
                        className="h-3 w-3 animate-gf-pulse"
                        aria-hidden="true"
                      />
                    ) : (
                      <span
                        className="h-1.5 w-1.5 rounded-full bg-primary-500 animate-gf-pulse"
                        aria-hidden="true"
                      />
                    )}
                    {phaseLabel}
                  </span>
                )}
              </div>
              <p className="truncate text-xs text-neutral-500">
                Weather, prices &amp; farming advice — English, اردو, Roman Urdu
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={toggleAutoSpeak}
              aria-pressed={autoSpeak}
              aria-label={
                autoSpeak ? "Turn off voice replies" : "Turn on voice replies"
              }
              title={autoSpeak ? "Voice replies on" : "Voice replies off"}
              className={
                autoSpeak
                  ? "inline-flex h-8 items-center gap-1.5 rounded-full bg-primary-600 px-3 text-primary-50 shadow-[0_2px_8px_-2px_rgba(22,101,52,0.5)] transition-colors duration-150 hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-1"
                  : "inline-flex h-8 items-center gap-1.5 rounded-full border border-primary-200 bg-white px-3 text-primary-700 transition-colors duration-150 hover:border-primary-400 hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-1"
              }
            >
              {autoSpeak ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
              <span className="hidden text-xs font-medium sm:inline">
                {autoSpeak ? "Voice on" : "Voice off"}
              </span>
            </button>
            {messages.length > 0 && (
              <button
                type="button"
                onClick={clearConversation}
                aria-label="Clear conversation"
                title="Clear conversation"
                className={headerIconButton}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Conversation */}
        <div className="relative">
          <AssistantMessages
            messages={messages}
            statusLabel={statusLabel}
            onRetry={retry}
            onSpeakMessage={speakMessage}
            onSend={(text) => void sendMessage(text)}
          />
        </div>

        {/* Voice notice — mic blocked, transcription failed, TTS down.
            Never blocks typing; purely informational. */}
        {voiceNotice && (
          <div className="relative mx-4 mb-3 flex items-start gap-2 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 sm:mx-5">
            <Info
              className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600"
              aria-hidden="true"
            />
            <p className="text-xs leading-relaxed text-amber-600">
              {voiceNotice}
            </p>
          </div>
        )}

        {/* Input */}
        <div className="relative">
          <AssistantComposer
            phase={phase}
            isBusy={isBusy}
            micSupported={micSupported}
            onSend={(text) => void sendMessage(text)}
            onStartListening={() => void startListening()}
            onStopListening={stopListening}
            onStop={stop}
          />
        </div>
      </div>
    </Card>
  );
}