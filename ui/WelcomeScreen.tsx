"use client";

interface WelcomeScreenProps {
  onSuggestion: (text: string) => void;
}

const QUICK_CARDS = [
  {
    icon: "pothole",
    title: "Check 311 Status",
    desc: "Potholes, trash & repairs",
    query: "Has my pothole on Blue Hill Ave been fixed? And is it worth going outside today?",
    color: "var(--bp-teal)",
  },
  {
    icon: "weather",
    title: "Weather Today",
    desc: "Is it nice outside?",
    query: "What's the weather like in Boston today? Should I go outside?",
    color: "var(--bp-blue)",
  },
  {
    icon: "event",
    title: "Events Near Me",
    desc: "Free activities & community",
    query: "What free events are happening in Boston today?",
    color: "var(--bp-purple)",
  },
  {
    icon: "pulse",
    title: "Full City Update",
    desc: "Everything at a glance",
    query: "Give me a full Boston update — weather, events, and any 311 issues in Dorchester",
    color: "var(--bp-accent)",
  },
];

const EXAMPLE_PROMPTS = [
  {
    lang: "🇺🇸",
    text: "Is it worth going outside today? Has my pothole on Blue Hill Ave been fixed?",
  },
  {
    lang: "🇪🇸",
    text: "¿Hay eventos cerca de Roxbury hoy?",
  },
  {
    lang: "🇧🇷",
    text: "Como está o tempo e tem alguma reclamação nova em Dorchester?",
  },
];

export function WelcomeScreen({ onSuggestion }: WelcomeScreenProps) {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[500px] p-6">
      <div className="max-w-lg w-full text-center">
        {/* Hero icon */}
        <div className="relative mx-auto w-20 h-20 mb-6">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[var(--bp-accent)]/20 to-[var(--bp-teal)]/10 blur-xl" />
          <div className="relative h-full w-full rounded-2xl bg-[var(--bp-surface)] border border-[var(--bp-border)] flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--bp-accent)]">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-[var(--bp-text)] mb-1">
          Boston 311 Agent
        </h1>
        <p className="text-sm font-medium text-[var(--bp-accent)] mb-2">
          One Conversation. Every City Service.
        </p>
        <p className="text-xs text-[var(--bp-text-muted)] mb-6 leading-relaxed">
          Ask about potholes, weather, events, or anything about Boston in any language.
        </p>

        {/* Multilingual example prompts */}
        <div className="mb-6 space-y-2">
          {EXAMPLE_PROMPTS.map((p) => (
            <button
              key={p.lang}
              type="button"
              onClick={() => onSuggestion(p.text)}
              className="w-full text-left px-4 py-2.5 rounded-xl bg-[var(--bp-surface)] border border-[var(--bp-border)] hover:border-[var(--bp-border-light)] hover:bg-[var(--bp-surface-2)] transition-all duration-200 active:scale-[0.99]"
            >
              <span className="text-sm mr-2">{p.lang}</span>
              <span className="text-xs text-[var(--bp-text-muted)] italic">&ldquo;{p.text}&rdquo;</span>
            </button>
          ))}
        </div>

        {/* Quick action cards */}
        <div className="grid grid-cols-2 gap-3">
          {QUICK_CARDS.map((card) => (
            <button
              key={card.title}
              type="button"
              onClick={() => onSuggestion(card.query)}
              className={[
                "group text-left p-4 rounded-xl",
                "bg-[var(--bp-surface)] border border-[var(--bp-border)]",
                "hover:border-[var(--bp-border-light)] hover:bg-[var(--bp-surface-2)]",
                "transition-all duration-200",
                "active:scale-[0.98]",
              ].join(" ")}
            >
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center mb-3"
                style={{ backgroundColor: `color-mix(in srgb, ${card.color} 12%, transparent)` }}
              >
                <CardIcon type={card.icon} color={card.color} />
              </div>
              <p className="text-sm font-semibold text-[var(--bp-text)] group-hover:text-[var(--bp-accent)] transition-colors">
                {card.title}
              </p>
              <p className="text-xs text-[var(--bp-text-faint)] mt-0.5">
                {card.desc}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function CardIcon({ type, color }: { type: string; color: string }) {
  const props = {
    width: 16,
    height: 16,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (type) {
    case "pothole":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="10" />
          <path d="M8 12h8M12 8v8" />
        </svg>
      );
    case "weather":
      return (
        <svg {...props}>
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
          <circle cx="12" cy="12" r="4" />
        </svg>
      );
    case "event":
      return (
        <svg {...props}>
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
          <circle cx="12" cy="16" r="1" />
        </svg>
      );
    case "pulse":
      return (
        <svg {...props}>
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      );
    default:
      return null;
  }
}
