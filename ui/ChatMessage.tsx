"use client";

import ReactMarkdown from "react-markdown";

export interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  durationMs?: number;
}

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={[
        "flex gap-3 max-w-3xl mx-auto w-full px-5 animate-[bp-slide-up_0.3s_var(--bp-ease)]",
        isUser ? "flex-row-reverse" : "flex-row",
      ].join(" ")}
    >
      {/* Avatar */}
      <div className="shrink-0 mt-1">
        {isUser ? <UserAvatar /> : <AgentAvatar streaming={message.isStreaming} />}
      </div>

      {/* Bubble */}
      <div
        className={[
          "min-w-0 max-w-[85%]",
          isUser ? "flex flex-col items-end" : "flex flex-col items-start",
        ].join(" ")}
      >
        {/* Name + timestamp */}
        <div className={[
          "flex items-center gap-2 mb-1.5 px-1",
          isUser ? "flex-row-reverse" : "flex-row",
        ].join(" ")}>
          <span className="text-[11px] font-semibold text-[var(--bp-text-muted)]">
            {isUser ? "You" : "BostonPulse"}
          </span>
          <span className="text-[10px] text-[var(--bp-text-faint)]">
            {formatTime(message.timestamp)}
          </span>
          {message.durationMs !== undefined && !isUser && (
            <span className="text-[10px] text-[var(--bp-text-faint)]">
              {message.durationMs < 1000
                ? `${message.durationMs}ms`
                : `${(message.durationMs / 1000).toFixed(1)}s`}
            </span>
          )}
        </div>

        {/* Content */}
        <div
          className={[
            "rounded-2xl px-4 py-3",
            isUser
              ? "bg-[var(--bp-accent)] text-white rounded-tr-md"
              : "bg-[var(--bp-surface)] border border-[var(--bp-border)] text-[var(--bp-text)] rounded-tl-md",
          ].join(" ")}
        >
          {message.isStreaming && !message.content ? (
            <TypingIndicator />
          ) : isUser ? (
            <p className="text-sm leading-relaxed">{message.content}</p>
          ) : (
            <div className="text-sm leading-relaxed prose prose-invert prose-sm max-w-none bp-prose">
              <ReactMarkdown>{message.content}</ReactMarkdown>
              {message.isStreaming && (
                <span className="inline-block w-1.5 h-4 bg-[var(--bp-accent)] ml-0.5 animate-[bp-blink_0.8s_step-end_infinite] align-middle rounded-sm" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 py-1 px-1">
      <span className="h-2 w-2 rounded-full bg-[var(--bp-accent)] animate-bounce [animation-delay:0ms]" />
      <span className="h-2 w-2 rounded-full bg-[var(--bp-accent)] animate-bounce [animation-delay:150ms]" />
      <span className="h-2 w-2 rounded-full bg-[var(--bp-accent)] animate-bounce [animation-delay:300ms]" />
    </div>
  );
}

function UserAvatar() {
  return (
    <div className="h-8 w-8 rounded-full bg-[var(--bp-accent)]/20 border border-[var(--bp-accent)]/30 flex items-center justify-center">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--bp-accent)]">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    </div>
  );
}

function AgentAvatar({ streaming }: { streaming?: boolean }) {
  return (
    <div className={[
      "h-8 w-8 rounded-full flex items-center justify-center relative",
      "bg-gradient-to-br from-[var(--bp-accent)]/20 to-[var(--bp-teal)]/20",
      "border border-[var(--bp-accent)]/20",
    ].join(" ")}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--bp-accent)]">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
      {streaming && (
        <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[var(--bp-accent)] border-2 border-[var(--bp-bg)] animate-pulse" />
      )}
    </div>
  );
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}
