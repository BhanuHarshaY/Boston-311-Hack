"use client";

import Image from "next/image";

interface HeaderProps {
  onToggleSidebar: () => void;
  onToggleReasoning: () => void;
  sidebarOpen: boolean;
  reasoningOpen: boolean;
  hasActiveReasoning: boolean;
}

export function Header({
  onToggleSidebar,
  onToggleReasoning,
  sidebarOpen,
  reasoningOpen,
  hasActiveReasoning,
}: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-5 py-3 border-b border-[var(--bp-border)] bg-[var(--bp-bg-subtle)]/80 backdrop-blur-xl shrink-0 z-50">
      {/* Left — Brand */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <Image
            src="/logo.png"
            alt="Boston 311"
            width={32}
            height={32}
            className="rounded-lg"
          />
          <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[var(--bp-green)] border-2 border-[var(--bp-bg-subtle)] animate-pulse" />
        </div>
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-bold text-[var(--bp-text)] tracking-tight">
            Boston 311
          </span>
          <span className="text-[10px] text-[var(--bp-accent)] font-semibold bg-[var(--bp-accent-glow)] border border-[var(--bp-accent)]/20 px-2 py-0.5 rounded-full">
            LIVE
          </span>
        </div>
      </div>

      {/* Center — tagline */}
      <p className="hidden md:block text-xs text-[var(--bp-text-faint)] font-medium">
        One Conversation. Every City Service.
      </p>

      {/* Right — controls */}
      <div className="flex items-center gap-2">
        <ToggleButton
          active={sidebarOpen}
          onClick={onToggleSidebar}
          label="City Data"
          icon={<CityIcon />}
        />
        <ToggleButton
          active={reasoningOpen}
          onClick={onToggleReasoning}
          label="Reasoning"
          icon={<BrainIcon />}
          pulse={hasActiveReasoning}
        />
      </div>
    </header>
  );
}

function ToggleButton({
  active,
  onClick,
  label,
  icon,
  pulse,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
  pulse?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium",
        "transition-all duration-200",
        "border",
        active
          ? "bg-[var(--bp-accent-glow)] border-[var(--bp-accent)]/20 text-[var(--bp-accent)]"
          : "bg-transparent border-[var(--bp-border)] text-[var(--bp-text-faint)] hover:text-[var(--bp-text-muted)] hover:border-[var(--bp-border-light)]",
      ].join(" ")}
    >
      <span className="relative">
        {icon}
        {pulse && (
          <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-[var(--bp-accent)] animate-pulse" />
        )}
      </span>
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function CityIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="10" width="4" height="12" rx="0.5" />
      <rect x="10" y="4" width="4" height="18" rx="0.5" />
      <rect x="16" y="7" width="4" height="15" rx="0.5" />
      <line x1="2" y1="22" x2="22" y2="22" />
    </svg>
  );
}

function BrainIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" />
      <line x1="9" y1="22" x2="15" y2="22" />
      <line x1="10" y1="19" x2="14" y2="19" />
    </svg>
  );
}
