"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { ChatInput } from "./ChatInput";
import { ChatMessage, type Message } from "./ChatMessage";
import { WelcomeScreen } from "./WelcomeScreen";
import {
  parseStreamContent,
  type ParsedToolUse,
  type ReasoningStep,
} from "@/lib/stream-parser";
import type { ActiveReasoning } from "./Layout";

interface ChatViewProps {
  onReasoningUpdate: (reasoning: ActiveReasoning | null) => void;
}

let msgId = 0;

export function ChatView({ onReasoningUpdate }: ChatViewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = useCallback(
    async (text: string) => {
      if (loading) return;

      const userMsg: Message = {
        id: ++msgId,
        role: "user",
        content: text,
        timestamp: new Date(),
      };

      const assistantMsg: Message = {
        id: ++msgId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
        isStreaming: true,
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setLoading(true);

      const startTime = Date.now();
      const assistantId = assistantMsg.id;

      // Build conversation history for context
      const history = messages
        .filter((m) => m.content)
        .map((m) => ({ role: m.role, content: m.content }));

      try {
        const result = await consumeStream(
          text,
          history,
          (state) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: state.answer }
                  : m,
              ),
            );
            onReasoningUpdate({
              steps: state.steps,
              toolInvocations: state.toolInvocations,
              isStreaming: true,
            });
            scrollToBottom();
          },
        );

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content: result.answer,
                  isStreaming: false,
                  durationMs: Date.now() - startTime,
                }
              : m,
          ),
        );
        onReasoningUpdate({
          steps: result.steps.map((s) => ({ ...s, status: "complete" as const })),
          toolInvocations: result.toolInvocations.map((t) => ({ ...t, hasResult: true })),
          isStreaming: false,
        });
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : "Something went wrong";
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: `Error: ${errMsg}`, isStreaming: false }
              : m,
          ),
        );
        onReasoningUpdate(null);
      } finally {
        setLoading(false);
      }
    },
    [loading, messages, onReasoningUpdate, scrollToBottom],
  );

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <WelcomeScreen onSuggestion={handleSend} />
        ) : (
          <div className="py-6 space-y-6">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <ChatInput onSend={handleSend} disabled={loading} />
    </div>
  );
}

// ─── Streaming integration ──────────────────────────────────

async function consumeStream(
  task: string,
  history: { role: string; content: string }[],
  onUpdate: (state: {
    steps: ReasoningStep[];
    answer: string;
    toolInvocations: ParsedToolUse[];
  }) => void,
) {
  const res = await fetch("/api/agent/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: task,
      conversationHistory: history,
    }),
  });

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const err = await res.json();
      if (err?.error) detail = err.error;
    } catch {
      /* not JSON */
    }
    throw new Error(detail);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";
  let fullContent = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const event = parseSSELine(line);
      if (!event) continue;
      if (event.type === "delta" && event.content) {
        fullContent += event.content;
        onUpdate(parseStreamContent(fullContent));
      } else if (event.type === "error") {
        throw new Error(event.message ?? "Stream error");
      }
    }
  }

  const finalState = parseStreamContent(fullContent);
  return {
    answer: finalState.answer,
    steps: finalState.steps,
    toolInvocations: finalState.toolInvocations,
  };
}

function parseSSELine(
  line: string,
): { type: string; content?: string; message?: string } | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith("data:")) return null;
  const raw = trimmed.slice(5).trim();
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
