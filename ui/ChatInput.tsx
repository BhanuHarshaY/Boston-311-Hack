"use client";

import { useState, useRef, useEffect } from "react";

const SUGGESTIONS = [
  "What's happening in Boston tonight?",
  "Is the Red Line running?",
  "Will it rain today?",
  "Any events near Fenway?",
  "Give me a full city briefing",
  "What's trending in Boston?",
];

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!disabled && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [disabled]);

  function autoResize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }

  function handleSubmit() {
    const msg = value.trim();
    if (!msg || disabled) return;
    onSend(msg);
    setValue("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }

  const showSuggestions = !value.trim() && !disabled;

  return (
    <div className="border-t border-[var(--bp-border)] bg-[var(--bp-bg-subtle)]/60 backdrop-blur-xl">
      {/* Suggestion chips */}
      {showSuggestions && (
        <div className="px-5 pt-4 pb-1">
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onSend(s)}
                className={[
                  "text-[11px] px-3 py-1.5 rounded-full",
                  "border border-[var(--bp-border)] bg-[var(--bp-glass)]",
                  "text-[var(--bp-text-muted)]",
                  "hover:bg-[var(--bp-accent-glow)] hover:border-[var(--bp-accent)]/20",
                  "hover:text-[var(--bp-accent)]",
                  "transition-all duration-200",
                ].join(" ")}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="p-4">
        <div
          className={[
            "flex items-end gap-3 rounded-2xl",
            "bg-[var(--bp-surface)] border",
            "transition-all duration-200",
            disabled
              ? "border-[var(--bp-border)] opacity-60"
              : "border-[var(--bp-border)] focus-within:border-[var(--bp-accent)]/30 focus-within:shadow-[var(--bp-shadow-glow)]",
            "px-4 py-3",
          ].join(" ")}
        >
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              autoResize();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder={disabled ? "Agent is thinking..." : "Ask Boston311 agent anything..."}
            disabled={disabled}
            rows={1}
            className={[
              "flex-1 bg-transparent text-sm text-[var(--bp-text)]",
              "placeholder:text-[var(--bp-text-faint)]",
              "outline-none resize-none",
              "min-h-[24px] max-h-[120px]",
              "leading-relaxed",
            ].join(" ")}
          />

          <button
            type="button"
            onClick={handleSubmit}
            disabled={disabled || !value.trim()}
            className={[
              "shrink-0 flex items-center justify-center",
              "h-9 w-9 rounded-xl",
              "transition-all duration-200",
              disabled || !value.trim()
                ? "bg-[var(--bp-surface-2)] text-[var(--bp-text-faint)]"
                : "bg-[var(--bp-accent)] text-white hover:brightness-110 active:scale-95 shadow-[var(--bp-shadow-glow)]",
            ].join(" ")}
          >
            {disabled ? <LoadingSpinner /> : <SendIcon />}
          </button>
        </div>

        <p className="text-[10px] text-[var(--bp-text-faint)] text-center mt-2">
          Powered by{" "}
          <a
            href="https://subconscious.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--bp-accent)]/70 hover:text-[var(--bp-accent)] transition-colors"
          >
            Subconscious
          </a>
          {" "} reasoning engine
        </p>
      </div>
    </div>
  );
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 2L11 13" />
      <path d="M22 2L15 22L11 13L2 9L22 2Z" />
    </svg>
  );
}

function LoadingSpinner() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
      <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
    </svg>
  );
}
