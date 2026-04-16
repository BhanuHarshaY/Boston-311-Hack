"use client";

import { useState, useCallback } from "react";
import { Header } from "./Header";
import { ChatView } from "./ChatView";
import { LiveSidebar } from "./LiveSidebar";
import { ReasoningPanel } from "./ReasoningPanel";
import type { ParsedToolUse, ReasoningStep } from "@/lib/stream-parser";

export interface ActiveReasoning {
  steps: ReasoningStep[];
  toolInvocations: ParsedToolUse[];
  isStreaming: boolean;
}

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [reasoningOpen, setReasoningOpen] = useState(false);
  const [activeReasoning, setActiveReasoning] =
    useState<ActiveReasoning | null>(null);

  const handleReasoningUpdate = useCallback(
    (reasoning: ActiveReasoning | null) => {
      setActiveReasoning(reasoning);
      if (reasoning && reasoning.steps.length > 0) {
        setReasoningOpen(true);
      }
    },
    [],
  );

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[var(--bp-bg)]">
      <Header
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onToggleReasoning={() => setReasoningOpen(!reasoningOpen)}
        sidebarOpen={sidebarOpen}
        reasoningOpen={reasoningOpen}
        hasActiveReasoning={activeReasoning !== null && activeReasoning.isStreaming}
      />

      <main className="flex-1 flex min-h-0 relative">
        {/* Live Data Sidebar — left */}
        <aside
          className={[
            "hidden lg:flex flex-col border-r border-[var(--bp-border)]",
            "bg-[var(--bp-bg-subtle)] transition-all duration-300",
            sidebarOpen ? "w-72 xl:w-80" : "w-0 overflow-hidden",
          ].join(" ")}
        >
          {sidebarOpen && <LiveSidebar />}
        </aside>

        {/* Chat — center */}
        <div className="flex-1 min-w-0 flex flex-col">
          <ChatView onReasoningUpdate={handleReasoningUpdate} />
        </div>

        {/* Reasoning Panel — right */}
        <aside
          className={[
            "hidden lg:flex flex-col border-l border-[var(--bp-border)]",
            "bg-[var(--bp-bg-subtle)] transition-all duration-300",
            reasoningOpen ? "w-80 xl:w-96" : "w-0 overflow-hidden",
          ].join(" ")}
        >
          {reasoningOpen && <ReasoningPanel reasoning={activeReasoning} />}
        </aside>
      </main>
    </div>
  );
}
