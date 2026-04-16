"use client";

import type { ActiveReasoning } from "./Layout";
import { formatToolParams } from "@/lib/stream-parser";
import type { ReasoningStep, ParsedToolUse } from "@/lib/stream-parser";

const TOOL_ICONS: Record<string, string> = {
  query_311_cases: "🏛️",
  get_weather: "☀️",
  get_local_events: "🎉",
  get_neighborhood_trends: "📈",
  web_search: "🔍",
  tweet_search: "🐦",
  fresh_search: "🔍",
  news_search: "📰",
};

function getToolIcon(name: string): string {
  return TOOL_ICONS[name] ?? "🔧";
}

interface ReasoningPanelProps {
  reasoning: ActiveReasoning | null;
}

export function ReasoningPanel({ reasoning }: ReasoningPanelProps) {
  if (!reasoning || reasoning.steps.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <PanelHeader title="Agent Reasoning" />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <div className="h-12 w-12 rounded-xl bg-[var(--bp-surface)] border border-[var(--bp-border)] flex items-center justify-center mx-auto mb-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--bp-text-faint)]">
                <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" />
                <line x1="9" y1="22" x2="15" y2="22" />
              </svg>
            </div>
            <p className="text-xs text-[var(--bp-text-faint)] leading-relaxed">
              Reasoning steps will appear here when the agent runs
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { steps, toolInvocations, isStreaming } = reasoning;
  const completedCount = steps.filter((s) => s.status === "complete").length;

  return (
    <div className="flex flex-col h-full">
      <PanelHeader
        title="Agent Reasoning"
        badge={
          isStreaming
            ? `${completedCount}/${steps.length} steps`
            : `${steps.length} step${steps.length > 1 ? "s" : ""}`
        }
        streaming={isStreaming}
      />

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {steps.map((step, i) => (
          <StepNode
            key={`${step.title}-${i}`}
            step={step}
            isLast={i === steps.length - 1}
            isActive={i === steps.length - 1 && isStreaming && step.status !== "complete"}
          />
        ))}
      </div>

      {/* Tool summary */}
      {toolInvocations.length > 0 && (
        <div className="border-t border-[var(--bp-border)] p-4">
          <p className="text-[10px] font-semibold text-[var(--bp-text-faint)] uppercase tracking-wider mb-2">
            Tools Used
          </p>
          <div className="flex flex-wrap gap-1.5">
            {toolInvocations.map((t, i) => (
              <span
                key={`${t.toolName}-${i}`}
                className={[
                  "text-[10px] font-mono px-2 py-0.5 rounded-md",
                  "border",
                  t.hasResult
                    ? "bg-[var(--bp-green-soft)] text-[var(--bp-green)] border-[var(--bp-green)]/20"
                    : "bg-[var(--bp-accent-glow)] text-[var(--bp-accent)] border-[var(--bp-accent)]/20 animate-pulse",
                ].join(" ")}
              >
                {t.toolName}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PanelHeader({
  title,
  badge,
  streaming,
}: {
  title: string;
  badge?: string;
  streaming?: boolean;
}) {
  return (
    <div className="px-4 py-3 border-b border-[var(--bp-border)] flex items-center gap-2">
      {streaming && (
        <span className="h-2 w-2 rounded-full bg-[var(--bp-accent)] animate-pulse shrink-0" />
      )}
      <h3 className="text-[11px] font-semibold text-[var(--bp-text-muted)] uppercase tracking-wider">
        {title}
      </h3>
      {badge && (
        <span className="text-[10px] text-[var(--bp-text-faint)] ml-auto">
          {badge}
        </span>
      )}
    </div>
  );
}

function StepNode({
  step,
  isLast,
  isActive,
}: {
  step: ReasoningStep;
  isLast: boolean;
  isActive: boolean;
}) {
  const statusColor =
    step.status === "complete"
      ? "var(--bp-green)"
      : step.status === "tool-use"
        ? "var(--bp-teal)"
        : "var(--bp-accent)";

  return (
    <div
      className="relative animate-[bp-slide-up_0.25s_var(--bp-ease)]"
      style={step.depth > 0 ? { marginLeft: `${step.depth * 16}px` } : undefined}
    >
      {/* Connector line */}
      {!isLast && (
        <div
          className="absolute left-[11px] top-[28px] bottom-[-8px] w-px"
          style={{ backgroundColor: `color-mix(in srgb, ${statusColor} 20%, transparent)` }}
        />
      )}

      <div
        className={[
          "rounded-lg border p-3",
          "transition-all duration-200",
          isActive
            ? "bg-[var(--bp-accent-glow2)] border-[var(--bp-accent)]/15"
            : "bg-[var(--bp-glass)] border-[var(--bp-glass-border)]",
        ].join(" ")}
      >
        {/* Header */}
        <div className="flex items-center gap-2">
          <StepDot status={step.status} active={isActive} />
          <span className="text-[11px] font-semibold text-[var(--bp-text-muted)] flex-1 truncate">
            {step.title}
          </span>
          <StepBadge status={step.status} active={isActive} />
        </div>

        {/* Thought */}
        {step.thought && (
          <p className={[
            "text-[11px] leading-relaxed mt-2 pl-6",
            "text-[var(--bp-text-faint)]",
            isActive ? "bp-streaming-cursor" : "",
          ].join(" ")}>
            {step.thought.length > 200 ? step.thought.slice(0, 200) + "..." : step.thought}
          </p>
        )}

        {/* Tool calls */}
        {step.toolUses.length > 0 && (
          <div className="mt-2 pl-6 space-y-1.5">
            {step.toolUses.map((tu, j) => (
              <ToolCard key={`${tu.toolName}-${j}`} tool={tu} />
            ))}
          </div>
        )}

        {/* Conclusion */}
        {step.conclusion && (
          <p className="text-[11px] text-[var(--bp-green)]/70 mt-2 pl-6 border-l-2 border-[var(--bp-green)]/20 ml-6">
            {step.conclusion.length > 150 ? step.conclusion.slice(0, 150) + "..." : step.conclusion}
          </p>
        )}
      </div>
    </div>
  );
}

function StepDot({ status, active }: { status: string; active: boolean }) {
  if (status === "complete") {
    return (
      <span className="h-[22px] w-[22px] rounded-full bg-[var(--bp-green-soft)] flex items-center justify-center shrink-0">
        <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="var(--bp-green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 8.5l3.5 3.5 6.5-8" />
        </svg>
      </span>
    );
  }
  return (
    <span className={[
      "h-[22px] w-[22px] rounded-full flex items-center justify-center shrink-0",
      "bg-[var(--bp-accent-glow)]",
    ].join(" ")}>
      <span className={[
        "h-2 w-2 rounded-full bg-[var(--bp-accent)]",
        active ? "animate-pulse" : "",
      ].join(" ")} />
    </span>
  );
}

function StepBadge({ status, active }: { status: string; active: boolean }) {
  if (status === "complete") {
    return <span className="text-[9px] font-medium text-[var(--bp-green)]/60">done</span>;
  }
  if (active && status === "tool-use") {
    return (
      <span className="flex items-center gap-1 text-[9px] font-medium text-[var(--bp-teal)]/70">
        <span className="h-1 w-1 rounded-full bg-[var(--bp-teal)] animate-pulse" />
        tool
      </span>
    );
  }
  if (active) {
    return (
      <span className="flex items-center gap-1 text-[9px] font-medium text-[var(--bp-accent)]/70">
        <span className="h-1 w-1 rounded-full bg-[var(--bp-accent)] animate-pulse" />
        thinking
      </span>
    );
  }
  return null;
}

function ToolCard({ tool }: { tool: ParsedToolUse }) {
  return (
    <div
      className={[
        "rounded-md border overflow-hidden",
        tool.hasResult
          ? "border-[var(--bp-green)]/15 bg-[var(--bp-green-soft)]"
          : "border-[var(--bp-teal)]/15 bg-[var(--bp-teal-soft)]",
      ].join(" ")}
    >
      <div className="flex items-center gap-2 px-2.5 py-1.5">
        <span className="text-sm">{getToolIcon(tool.toolName)}</span>
        <span className="text-[10px] font-semibold font-mono text-[var(--bp-teal)]">
          {tool.toolName}
        </span>
        <span className="ml-auto text-[9px] font-medium" style={{ color: tool.hasResult ? "var(--bp-green)" : "var(--bp-accent)" }}>
          {tool.hasResult ? "done" : "calling..."}
        </span>
      </div>
      {tool.parameters !== "{}" && (
        <pre className="border-t border-[var(--bp-border)] px-2.5 py-1.5 text-[10px] text-[var(--bp-text-faint)] font-mono leading-relaxed">
          {formatToolParams(tool.parameters)}
        </pre>
      )}
    </div>
  );
}
